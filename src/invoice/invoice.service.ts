// src/invoice/invoice.service.ts
import { AzureUtil } from "@util/azure.util";
import {
    TopicMessageSubmitTransaction,
    TokenCreateTransaction,
    TokenType,
    TokenSupplyType,
    Client,
    Hbar,
    TokenId,
    TransferTransaction,
    AccountId,
    AccountInfoQuery,
    ContractId,
} from "@hashgraph/sdk";
import { ethers } from "ethers";
import VoltEscrowArtifact from "../abi/VoltEscrow.json";
import InvoiceModel from "./invoice.model";
import { v4 as uuidv4 } from "uuid";
import UtilService from "@util/util.service";
import dotenv from "dotenv";
dotenv.config();

/* ====== ENV (keep SDK on TREASURY; EVM signer owns the escrow) ====== */
const TREASURY_ID = process.env.HEDERA_OPERATOR_ID!;                 // 0.0.6968947
const TREASURY_KEY = process.env.HEDERA_OPERATOR_KEY!;               // DER (Ed25519)
const RPC_URL = process.env.HEDERA_RPC_URL!;                     // https://testnet.hashio.io/api
const ESCROW_EVM = process.env.VOLT_ESCROW_EVM_ADDRESS!;            // 0x436c...
const EVM_OWNER_PK = process.env.HEDERA_EVM_OPERATOR_PRIVATE_KEY!;   // 0x...
const HCS_TOPIC_ID = process.env.HCS_TOPIC_ID!;
const ITOKEN_ESCROW_FUND = parseInt(process.env.ITOKEN_ESCROW_FUND || "0", 10);

/* ====== Clients ====== */
const hederaClient = Client.forTestnet().setOperator(TREASURY_ID, TREASURY_KEY); // <-- treasury (SDK)
const provider = new ethers.JsonRpcProvider(RPC_URL, { name: "hedera-testnet", chainId: 296 });
const signer = new ethers.Wallet(EVM_OWNER_PK, provider);                      // <-- escrow owner (EVM)
const escrow = new ethers.Contract(ESCROW_EVM, (VoltEscrowArtifact as any).abi, signer);

/* ====== Helpers ====== */
// 0.0.x -> mirror EVM address
function idToEvmAddress(id: string): string {
    if (id.startsWith("0x")) return ethers.getAddress(id);
    const [shardStr, realmStr, numStr] = id.split(".");
    const shard = BigInt(shardStr);
    const realm = BigInt(realmStr);
    const num = BigInt(numStr);
    const hex =
        shard.toString(16).padStart(8, "0") +
        realm.toString(16).padStart(16, "0") +
        num.toString(16).padStart(16, "0");
    return ethers.getAddress("0x" + hex);
}

// keep metadata <= ~100 bytes
function compactTokenMeta(inv: any): string {
    const MAX = 100;
    const meta: any = { i: String(inv.invoiceNumber), a: Number(inv.amount), u: (inv.blobUrl ?? "").slice(0, 40) };
    let s = JSON.stringify(meta);
    while (Buffer.byteLength(s, "utf8") > MAX && meta.u.length > 0) { meta.u = meta.u.slice(0, meta.u.length - 5); s = JSON.stringify(meta); }
    if (Buffer.byteLength(s, "utf8") > MAX) { delete meta.a; s = JSON.stringify(meta); }
    if (Buffer.byteLength(s, "utf8") > MAX) { delete meta.u; s = JSON.stringify(meta); }
    return s;
}

class InvoiceService {
    async createInvoice(businessId: string, data: any, file: any) {
        const blobUrl = await AzureUtil.uploadFileFromBuffer(file.buffer, `invoices/${uuidv4()}.pdf`);
        const invoice = await InvoiceModel.create({ ...data, blobUrl, status: "pending" });

        await UtilService.sendEmail(
            data.corporateEmail,
            `Verify Invoice ${data.invoiceNumber}`,
            `<p>Hello,</p>
       <p>You have a new invoice to verify from ${data.businessName || "a supplier"}.</p>
       <p><a href="${process.env.APP_URL}/verify/${invoice._id}">Click here to verify invoice ${data.invoiceNumber}</a></p>`
        );

        return invoice;
    }

    async verifyInvoice(id: string, verifier: string, corporateName: string) {
        const invoice = await InvoiceModel.findById(id);
        if (!invoice) throw new Error("Invalid or expired verification link");

        const tx = await new TopicMessageSubmitTransaction()
            .setTopicId(HCS_TOPIC_ID)
            .setMessage(JSON.stringify({ invoiceId: invoice.invoiceNumber, verifier, corporateName, verifiedAt: new Date() }))
            .execute(hederaClient);

        invoice.status = "verified";
        invoice.verifier = verifier;
        invoice.corporateName = corporateName;
        invoice.hcsTxId = tx.transactionId.toString();
        invoice.verifiedAt = new Date();
        await invoice.save();

        const tokenized = await this.tokenizeInvoice(invoice);
        return { ...invoice.toObject(), tokenized };
    }

    /* Tokenize -> associate escrow -> fund escrow */
    async tokenizeInvoice(invoice: any) {
        console.log("🔹 Tokenizing invoice:", invoice.invoiceNumber);

        // Derive the *correct* contract ID from the EVM address (prevents ENV drift)
        const ESCROW_CONTRACT_ID = ContractId.fromEvmAddress(0, 0, ESCROW_EVM).toString();
        console.log(`🔎 Resolved escrow IDs → ContractId: ${ESCROW_CONTRACT_ID} | EVM: ${ESCROW_EVM}`);

        // 1 token = $10 (0 decimals)
        const fractionSize = 10;
        const totalTokens = Math.floor(Number(invoice.amount) / fractionSize);
        if (totalTokens <= 0) throw new Error("totalTokens calculated to 0; increase invoice amount");

        const metaString = compactTokenMeta(invoice);
        console.log("ℹ️ Metadata size:", Buffer.byteLength(metaString, "utf8"), "bytes");

        // 1) Create token (treasury signs)
        const createTx = await new TokenCreateTransaction()
            .setTokenName(`Invoice-${invoice.invoiceNumber}`)
            .setTokenSymbol(`INV${invoice.invoiceNumber}`)
            .setTokenType(TokenType.FungibleCommon)
            .setTreasuryAccountId(TREASURY_ID)
            .setInitialSupply(totalTokens)
            .setSupplyType(TokenSupplyType.Finite)
            .setMaxSupply(totalTokens)
            .setDecimals(0)
            .setMaxTransactionFee(new Hbar(20))
            .setMetadata(Buffer.from(metaString, "utf8"))
            .execute(hederaClient);

        const receipt = await createTx.getReceipt(hederaClient);
        const tokenId = receipt.tokenId?.toString();
        if (!tokenId) throw new Error("No tokenId returned in receipt");
        const tokenEvm = idToEvmAddress(tokenId);

        console.log("✅ iToken Created:", tokenId, tokenEvm);

        // 2) Associate escrow via contract (owner-only)
        try {
            const aTx = await escrow.associateWithToken(tokenEvm);
            await aTx.wait();
            console.log("🤝 Escrow successfully associated with iToken:", tokenEvm);
        } catch (e: any) {
            const msg = String(e?.reason || e?.message || e);
            // If it's “already associated”, proceed; otherwise surface it
            if (/(ALREADY|already|rc != SUCCESS)/.test(msg)) {
                console.log("ℹ️ Association skipped (likely already associated):", msg);
            } else {
                throw new Error("Escrow association failed: " + msg);
            }
        }

        // 3) Optional: check association on mirror (best-effort)
        try {
            const info = await new AccountInfoQuery().setAccountId(ESCROW_CONTRACT_ID).execute(hederaClient);
            let isAssociated = false;
            const rels: any = info.tokenRelationships;
            if (rels && typeof rels.keys === "function") {
                for (const tid of rels.keys()) {
                    if (tid.toString() === tokenId) { isAssociated = true; break; }
                }
            } else if (Array.isArray(rels)) {
                isAssociated = rels.some((rel: any) => rel.tokenId?.toString() === tokenId);
            }
            console.log(isAssociated ? "✅ Escrow association confirmed on-chain" : "⚠️ Association not visible yet (continuing)");
        } catch {
            console.log("ℹ️ Skipping association confirmation (mirror may still be catching up)");
        }

        // 4) Fund escrow (⚠️ use the ContractId we just derived)
        try {
            const fundAmount = ITOKEN_ESCROW_FUND || totalTokens;
            console.log(`💰 Funding escrow ${ESCROW_CONTRACT_ID} with`, fundAmount, "iTokens…");
            const fundTx = await new TransferTransaction()
                .addTokenTransfer(TokenId.fromString(tokenId), AccountId.fromString(TREASURY_ID), -fundAmount)
                .addTokenTransfer(TokenId.fromString(tokenId), AccountId.fromString(ESCROW_CONTRACT_ID), fundAmount)
                .setTransactionMemo(`Fund escrow for ${invoice.invoiceNumber}`)
                .execute(hederaClient);

            const fundRc = await fundTx.getReceipt(hederaClient);
            console.log("🏦 Escrow funded with iTokens:", fundRc.status.toString(), "amount:", fundAmount);
        } catch (fundError: any) {
            // If you still hit TOKEN_NOT_ASSOCIATED_TO_ACCOUNT here, the IDs truly don't match.
            console.error("❌ Funding escrow failed:", fundError.message || fundError);
            throw new Error("Funding escrow failed. Make sure escrow is associated and ContractId matches the EVM address.");
        }

        // 5) HCS event
        await new TopicMessageSubmitTransaction()
            .setTopicId(HCS_TOPIC_ID)
            .setMessage(JSON.stringify({
                event: "INVOICE_TOKENIZED",
                invoiceId: invoice._id,
                invoiceNumber: invoice.invoiceNumber,
                tokenId,
                tokenEvm,
                initialSupply: totalTokens,
                escrowFunded: ITOKEN_ESCROW_FUND || totalTokens,
                escrowContractId: ESCROW_CONTRACT_ID,
                createdAt: new Date(),
            }))
            .execute(hederaClient);

        // 6) Save to DB
        await InvoiceModel.findByIdAndUpdate(invoice._id, {
            tokenized: true,
            tokenId,
            tokenEvm,
            initialSupply: totalTokens,
            escrowContractId: ESCROW_CONTRACT_ID,          // e.g. "0.0.8036554"
            escrowEvm: ESCROW_EVM,                         // e.g. "0x803A0eF8..."
        });
        return { tokenId, tokenEvm, initialSupply: totalTokens, escrowContractId: ESCROW_CONTRACT_ID };
    }

    async getInvoiceById(id: string) {
        return await InvoiceModel.findById(id).populate("businessId", "firstName lastName email").lean();
    }

    async getInvoicesByBusiness(businessId: string) {
        return await InvoiceModel.find({ businessId }).sort({ createdAt: -1 }).lean();
    }

    async getVerifiedInvoices() {
        const invoices = await InvoiceModel.find({ status: "verified" }).sort({ createdAt: -1 }).lean();
        return invoices.map((inv: any) => ({
            _id: inv._id,
            invoiceNumber: inv.invoiceNumber,
            amount: inv.amount,
            currency: inv.currency,
            businessName: "SME",
            tokenId: inv.tokenId,
            tokenEvm: inv.tokenEvm,
            blobUrl: inv.blobUrl,
            status: inv.status,
            verifiedAt: inv.verifiedAt,
            hcsTxId: inv.hcsTxId || null,
            tokenized: inv.tokenized || false,
            initialSupply: inv.initialSupply,
            escrowContractId: inv.escrowContractId,
        }));
    }
}

export default new InvoiceService();