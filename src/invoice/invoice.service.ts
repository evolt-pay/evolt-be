import { AzureUtil } from "../util/azure.util.js";
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
    ContractId,
} from "@hashgraph/sdk";
import { ethers } from "ethers";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { v4 as uuidv4 } from "uuid";
import dotenv from "dotenv";

import InvoiceModel from "./invoice.model.js";
import UtilService from "../util/util.service.js";
import businessService from "../business/business.service.js";
import corporateService from "../corporate/corporate.service.js";
import { InvoiceDto } from "./invoice.dto.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const abiPath = path.resolve(__dirname, "../abi/VoltEscrow.json");
const VoltEscrowArtifact = JSON.parse(fs.readFileSync(abiPath, "utf-8"));

const TREASURY_ID = process.env.HEDERA_OPERATOR_ID!;
const TREASURY_KEY = process.env.HEDERA_OPERATOR_KEY!;
const RPC_URL = process.env.HEDERA_RPC_URL!;
const ESCROW_EVM = process.env.VOLT_ESCROW_EVM_ADDRESS!;
const EVM_OWNER_PK = process.env.HEDERA_EVM_OPERATOR_PRIVATE_KEY!;
const HCS_TOPIC_ID = process.env.HCS_TOPIC_ID!;
const ITOKEN_ESCROW_FUND = parseInt(process.env.ITOKEN_ESCROW_FUND || "0", 10);

const hederaClient = Client.forTestnet().setOperator(TREASURY_ID, TREASURY_KEY);
const provider = new ethers.JsonRpcProvider(RPC_URL, { name: "hedera-testnet", chainId: 296 });
const signer = new ethers.Wallet(EVM_OWNER_PK, provider);
const escrow = new ethers.Contract(ESCROW_EVM, (VoltEscrowArtifact as any).abi, signer);

function idToEvmAddress(id: string): string {
    if (id.startsWith("0x")) return ethers.getAddress(id);
    const [shardStr, realmStr, numStr] = id.split(".");
    const hex =
        BigInt(shardStr).toString(16).padStart(8, "0") +
        BigInt(realmStr).toString(16).padStart(16, "0") +
        BigInt(numStr).toString(16).padStart(16, "0");
    return ethers.getAddress("0x" + hex);
}

function compactTokenMeta(inv: any): string {
    const MAX = 100;
    const meta: any = { i: String(inv.invoiceNumber), a: Number(inv.amount), u: (inv.blobUrl ?? "").slice(0, 40) };
    let s = JSON.stringify(meta);
    while (Buffer.byteLength(s, "utf8") > MAX && meta.u.length > 0) {
        meta.u = meta.u.slice(0, meta.u.length - 5);
        s = JSON.stringify(meta);
    }
    if (Buffer.byteLength(s, "utf8") > MAX) {
        delete meta.a;
        s = JSON.stringify(meta);
    }
    if (Buffer.byteLength(s, "utf8") > MAX) {
        delete meta.u;
        s = JSON.stringify(meta);
    }
    return s;
}

class InvoiceService {
    async createInvoice(userId: string, data: any, file: any) {

        const business = await businessService.getBusiness(userId);
        if (!business) throw new Error("Business profile not found. Please complete KYB first.");

        if (!data.corporateId) throw new Error("Corporate ID is required.");
        const corporate = await corporateService.getCorporateById(data.corporateId);
        if (!corporate) throw new Error("Corporate not found in directory.");

        const blobUrl = await AzureUtil.uploadFileFromBuffer(file.buffer, `invoices/${uuidv4()}.pdf`);

        const invoice = await InvoiceModel.create({
            ...data,
            businessId: business._id,
            corporateId: corporate._id,
            blobUrl,
            status: "pending",
            yieldRate: data.yieldRate || 0.1,
            durationDays: data.durationDays || 90,
            totalTarget: data.totalTarget || data.amount,
            expiryDate: data.expiryDate || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        });

        const contactName = corporate.contactPerson ? ` ${corporate.contactPerson}` : "";
        await UtilService.sendEmail(
            corporate.email,
            `Verify Invoice ${invoice.invoiceNumber}`,
            `<p>Hello${contactName},</p>
       <p>You have a new invoice to verify from <b>${business.businessName}</b>.</p>
       <p><a href="${process.env.APP_URL}/verify/${invoice._id}">Click here to verify invoice ${invoice.invoiceNumber}</a></p>
       <p>Thank you,<br/>${process.env.APP_NAME || "Evolt Finance Team"}</p>`
        );

        return invoice;
    }

    async verifyInvoice(id: string, verifier: string) {
        const invoice = await InvoiceModel.findById(id);
        if (!invoice) throw new Error("Invalid or expired verification link");

        const corporate = await corporateService.getCorporateById(invoice.corporateId!.toString());
        const corporateName = corporate?.name || "Unknown";

        const tx = await new TopicMessageSubmitTransaction()
            .setTopicId(HCS_TOPIC_ID)
            .setMessage(
                JSON.stringify({
                    invoiceId: invoice.invoiceNumber,
                    verifier,
                    corporateName,
                    verifiedAt: new Date(),
                })
            )
            .execute(hederaClient);

        invoice.status = "verified";
        invoice.verifier = verifier;
        invoice.hcsTxId = tx.transactionId.toString();
        invoice.verifiedAt = new Date();
        await invoice.save();

        const tokenized = await this.tokenizeInvoice(invoice);
        return { ...invoice.toObject(), tokenized };
    }

    /** Tokenize verified invoice as iTokens */
    async tokenizeInvoice(invoice: any) {
        console.log("🔹 Tokenizing invoice:", invoice.invoiceNumber);

        const ESCROW_CONTRACT_ID = ContractId.fromEvmAddress(0, 0, ESCROW_EVM).toString();
        const fractionSize = 10;
        const totalTokens = Math.floor(Number(invoice.amount) / fractionSize);
        if (totalTokens <= 0) throw new Error("totalTokens calculated to 0; increase invoice amount");

        const metaString = compactTokenMeta(invoice);

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

        try {
            const aTx = await escrow.associateWithToken(tokenEvm);
            await aTx.wait();
            console.log("🤝 Escrow associated with iToken:", tokenEvm);
        } catch (e: any) {
            const msg = String(e?.reason || e?.message || e);
            if (!/(already|ALREADY|SUCCESS)/.test(msg)) {
                throw new Error("Escrow association failed: " + msg);
            }
        }

        const fundAmount = ITOKEN_ESCROW_FUND || totalTokens;
        const fundTx = await new TransferTransaction()
            .addTokenTransfer(TokenId.fromString(tokenId), AccountId.fromString(TREASURY_ID), -fundAmount)
            .addTokenTransfer(TokenId.fromString(tokenId), AccountId.fromString(ESCROW_CONTRACT_ID), fundAmount)
            .setTransactionMemo(`Fund escrow for ${invoice.invoiceNumber}`)
            .execute(hederaClient);

        const fundRc = await fundTx.getReceipt(hederaClient);
        console.log("🏦 Escrow funded:", fundRc.status.toString());

        await new TopicMessageSubmitTransaction()
            .setTopicId(HCS_TOPIC_ID)
            .setMessage(
                JSON.stringify({
                    event: "INVOICE_TOKENIZED",
                    invoiceId: invoice._id,
                    invoiceNumber: invoice.invoiceNumber,
                    tokenId,
                    tokenEvm,
                    initialSupply: totalTokens,
                    escrowContractId: ESCROW_CONTRACT_ID,
                    createdAt: new Date(),
                })
            )
            .execute(hederaClient);

        await InvoiceModel.findByIdAndUpdate(invoice._id, {
            tokenized: true,
            tokenId,
            tokenEvm,
            initialSupply: totalTokens,
            escrowContractId: ESCROW_CONTRACT_ID,
            escrowEvm: ESCROW_EVM,
        });

        return { tokenId, tokenEvm, initialSupply: totalTokens, escrowContractId: ESCROW_CONTRACT_ID };
    }

    async getInvoiceById(id: string): Promise<InvoiceDto | null> {
        const inv = await InvoiceModel.findById(id)
            .populate({ path: "businessId", select: "businessName description logoUrl", model: "Business" })
            .populate({ path: "corporateId", select: "name description logoUrl", model: "Corporate" })
            .lean();
        if (!inv) return null;

        const { businessId, corporateId, ...rest } = inv as any;

        return {
            ...rest,
            _id: String(inv._id),
            business: businessId ?? null,
            corporate: corporateId ?? null,
        };
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
            businessId: inv.businessId,
            corporateId: inv.corporateId,
            tokenId: inv.tokenId,
            tokenEvm: inv.tokenEvm,
            blobUrl: inv.blobUrl,
            status: inv.status,
            verifiedAt: inv.verifiedAt,
            hcsTxId: inv.hcsTxId,
            tokenized: inv.tokenized || false,
            initialSupply: inv.initialSupply,
            escrowContractId: inv.escrowContractId,
        }));
    }
}

export default new InvoiceService();