import {
    Client,
    TopicMessageSubmitTransaction,
    PrivateKey,
    AccountId,
} from "@hashgraph/sdk";
import { ethers } from "ethers";
import InvestmentModel, { InvestmentDoc } from "./investment.model.js";
import InvoiceModel from "../invoice/invoice.model.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";



const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import dotenv from "dotenv";
dotenv.config();

// ✅ Use fs to read the ABI file manually (no import attribute needed)
const abiPath = path.resolve(__dirname, "../abi/VoltEscrow.json");
const VoltEscrowArtifact = JSON.parse(fs.readFileSync(abiPath, "utf-8"));

/* ================== ENV ================== */
const RPC_URL = process.env.HEDERA_RPC_URL!;
const HCS_TOPIC_ID = process.env.HCS_TOPIC_ID!;
const HEDERA_EVM_OPERATOR_ID = process.env.HEDERA_EVM_OPERATOR_ID!;
const HEDERA_EVM_OPERATOR_PRIVATE_KEY = process.env.HEDERA_EVM_OPERATOR_PRIVATE_KEY!;

/* ================== ETHERS ================== */
const provider = new ethers.JsonRpcProvider(RPC_URL, {
    name: "hedera-testnet",
    chainId: 296,
});
const signer = new ethers.Wallet(HEDERA_EVM_OPERATOR_PRIVATE_KEY, provider);
const ESCROW_ABI = (VoltEscrowArtifact as any).abi;

/* ================== HEDERA SDK ================== */
const operatorId = AccountId.fromString(HEDERA_EVM_OPERATOR_ID);
const operatorKey = PrivateKey.fromStringECDSA(HEDERA_EVM_OPERATOR_PRIVATE_KEY);
const hederaClient = Client.forTestnet().setOperator(operatorId, operatorKey);

/* ================== HELPERS ================== */
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

function normalizeAccountIdOrAddr(account: string): string {
    return account.startsWith("0x")
        ? ethers.getAddress(account)
        : idToEvmAddress(account);
}
function normalizeTokenIdOrAddr(tokenId: string): string {
    return tokenId.startsWith("0x")
        ? ethers.getAddress(tokenId)
        : idToEvmAddress(tokenId);
}

/**
 * Find the correct escrow contract for a given token.
 * Reads invoice collection to resolve escrowContractId.
 */
async function getEscrowForToken(tokenIdOrEvm: string) {
    const invoice =
        (await InvoiceModel.findOne({ tokenId: tokenIdOrEvm }).lean()) ||
        (await InvoiceModel.findOne({
            tokenEvm: tokenIdOrEvm.startsWith("0x")
                ? ethers.getAddress(tokenIdOrEvm)
                : undefined,
        }).lean());

    if (!invoice)
        throw new Error(`Invoice not found for token ${tokenIdOrEvm}`);

    // ✅ Prefer the EVM address directly
    if (invoice.escrowEvm) {
        return {
            escrowEvm: ethers.getAddress(invoice.escrowEvm),
            tokenEvm: invoice.tokenEvm || idToEvmAddress(invoice.tokenId!),
        };
    }

    // fallback (numeric ContractId form)
    if (!invoice.escrowContractId)
        throw new Error(
            `Invoice ${invoice.invoiceNumber} missing escrowContractId`
        );

    const parts = String(invoice.escrowContractId).split(".");
    if (parts.length !== 3 || /[a-f]/i.test(parts[2])) {
        throw new Error(
            `Invalid escrowContractId format: ${invoice.escrowContractId}`
        );
    }

    const escrowEvm = idToEvmAddress(invoice.escrowContractId);
    const tokenEvm = invoice.tokenEvm || idToEvmAddress(invoice.tokenId!);
    return { escrowEvm, tokenEvm };
}

async function getEscrowContract(escrowEvm: string) {
    return new ethers.Contract(ethers.getAddress(escrowEvm), ESCROW_ABI, signer);
}

async function ensureOwner(escrow: ethers.Contract) {
    try {
        const [owner, signerAddr] = await Promise.all([
            escrow.owner(),
            signer.getAddress(),
        ]);
        if (owner.toLowerCase() !== signerAddr.toLowerCase()) {
            console.warn(
                `⚠️  Signer ${signerAddr} is not contract owner ${owner}. onlyOwner functions may revert.`
            );
        }
    } catch {
        /* ignore */
    }
}

// Associate escrow with a token (no-op if already associated)
async function tryAssociateToken(escrow: ethers.Contract, tokenEvm: string) {
    try {
        const tx = await escrow.associateWithToken(tokenEvm);
        await tx.wait();
        console.log(`🤝 Escrow associated with token ${tokenEvm}`);
    } catch (e: any) {
        const msg = String(e?.message || e);
        if (
            msg.includes("ALREADY_ASSOCIATED") ||
            msg.includes("TOKEN_ALREADY_ASSOCIATED") ||
            msg.toLowerCase().includes("already") ||
            msg.toLowerCase().includes("revert")
        ) {
            console.log(`ℹ️ Association skipped: ${msg}`);
        } else {
            console.log(`ℹ️ Association attempt failed (continuing): ${msg}`);
        }
    }
}

/* ================== SERVICE ================== */
class InvestmentService {
    /**
     * 1. Resolve correct escrow from invoice
     * 2. Associate escrow with token
     * 3. Release iTokens
     * 4. Record investment
     * 5. Save + emit event
     */
    async invest(investorId: string, data: any) {
        const {
            investorEmail,
            tokenId,
            invoiceNumber,
            vusdAmount,
            yieldRate = 0.1,
            durationInDays = 30,
        } = data;

        const investorEvm = normalizeAccountIdOrAddr(investorId);
        const { escrowEvm, tokenEvm } = await getEscrowForToken(tokenId);
        const escrow = await getEscrowContract(escrowEvm);

        await ensureOwner(escrow);

        // 1 iToken = 10 vUSD (0 decimals)
        const FRACTION_SIZE = 10;
        const iTokenAmount = Math.floor(Number(vusdAmount) / FRACTION_SIZE);
        if (!Number.isFinite(iTokenAmount) || iTokenAmount <= 0)
            throw new Error(
                `Calculated iTokenAmount=0. vusdAmount=${vusdAmount}, FRACTION_SIZE=${FRACTION_SIZE}`
            );

        const vusdUnits = BigInt(Math.round(Number(vusdAmount) * 10 ** 6)); // 6 decimals

        console.log(
            `🚀 Releasing ${iTokenAmount} iTokens to ${investorEvm} for invoice ${invoiceNumber} via escrow ${escrowEvm}`
        );

        // 1️⃣ Associate escrow with token
        await tryAssociateToken(escrow, tokenEvm);

        // 2️⃣ Release iTokens
        const tx1 = await escrow.releaseIToken(investorEvm, tokenEvm, iTokenAmount);
        await tx1.wait();

        // 3️⃣ Record investment on-chain
        const tx2 = await escrow.recordInvestment(investorEvm, tokenEvm, vusdUnits);
        await tx2.wait();

        // 4️⃣ Get index and persist in DB
        const len = await escrow.investmentsLength(investorEvm);
        const contractIndex = Number(len) - 1;

        const expectedYield = Number(vusdAmount) * Number(yieldRate);
        const maturedAt = new Date(
            Date.now() + durationInDays * 24 * 60 * 60 * 1000
        );

        const investment = await InvestmentModel.create({
            investorId,
            investorEvm,
            investorEmail,
            tokenId,
            tokenEvm,
            invoiceNumber,
            vusdAmount: Number(vusdAmount),
            iTokenAmount,
            yieldRate: Number(yieldRate),
            expectedYield,
            contractIndex,
            txId: tx2.hash,
            maturedAt,
        });

        // 5️⃣ Emit HCS message
        await new TopicMessageSubmitTransaction()
            .setTopicId(HCS_TOPIC_ID)
            .setMessage(
                JSON.stringify({
                    event: "INVESTMENT_RECORDED",
                    investorId,
                    investorEvm,
                    tokenId,
                    tokenEvm,
                    escrowEvm,
                    invoiceNumber,
                    vusdAmount,
                    iTokenAmount,
                    yieldRate,
                    expectedYield,
                    txId: tx2.hash,
                    timestamp: new Date(),
                })
            )
            .execute(hederaClient);

        console.log(
            `✅ Investment recorded successfully for ${investorId} via escrow ${escrowEvm}`
        );
        return { success: true, investment };
    }

    async getAllInvestments() {
        return await InvestmentModel.find().sort({ createdAt: -1 }).lean();
    }

    async getInvestmentsByInvestor(investorId: string) {
        return await InvestmentModel.find({ investorId })
            .sort({ createdAt: -1 })
            .lean();
    }

    async settleMaturedInvestments() {
        const matured = await InvestmentModel.find({
            status: "active",
            maturedAt: { $lte: new Date() },
        });

        let settled = 0;
        for (const inv of matured as InvestmentDoc[]) {
            const { escrowEvm, tokenEvm } = await getEscrowForToken(inv.tokenId);
            const escrow = await getEscrowContract(escrowEvm);

            await ensureOwner(escrow);

            if (inv.contractIndex === undefined || inv.contractIndex === null) {
                console.warn(`Skipping ${inv._id}: missing contractIndex`);
                continue;
            }

            const investorEvm = normalizeAccountIdOrAddr(inv.investorId);
            const yieldUnits = BigInt(
                Math.round(Number(inv.expectedYield) * 10 ** 6)
            );

            console.log(
                `💸 Settling yield for ${inv.invoiceNumber} (idx=${inv.contractIndex}) via escrow ${escrowEvm}`
            );

            const tx = await escrow.settleInvestment(
                investorEvm,
                inv.contractIndex,
                yieldUnits
            );
            await tx.wait();

            inv.status = "completed";
            await inv.save();
            settled++;

            await new TopicMessageSubmitTransaction()
                .setTopicId(HCS_TOPIC_ID)
                .setMessage(
                    JSON.stringify({
                        event: "YIELD_PAID",
                        investorId: inv.investorId,
                        investorEvm,
                        invoiceNumber: inv.invoiceNumber,
                        expectedYield: inv.expectedYield,
                        escrowEvm,
                        txId: tx.hash,
                        paidAt: new Date(),
                    })
                )
                .execute(hederaClient);

            console.log(`✅ Yield settled for ${inv.invoiceNumber}`);
        }

        return { settled };
    }
}

export default new InvestmentService();