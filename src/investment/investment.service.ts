import {
    Client,
    TopicMessageSubmitTransaction,
    PrivateKey,
    AccountId,
} from "@hashgraph/sdk";
import { ethers } from "ethers";
import axios from "axios";
import InvestmentModel, { InvestmentDoc } from "./investment.model.js";
import AssetModel from "../asset/asset.model.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { AssetDoc } from "asset/asset.type.js";
dotenv.config();

/* ========== Setup ========== */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const abiPath = path.resolve(__dirname, "../abi/VoltEscrow.json");
const VoltEscrowArtifact = JSON.parse(fs.readFileSync(abiPath, "utf-8"));
const ESCROW_ABI = (VoltEscrowArtifact as any).abi;

const RPC_URL = process.env.HEDERA_RPC_URL!;
const HCS_TOPIC_ID = process.env.HCS_TOPIC_ID!;
const HEDERA_EVM_OPERATOR_ID = process.env.HEDERA_EVM_OPERATOR_ID!;
const HEDERA_EVM_OPERATOR_PRIVATE_KEY = process.env.HEDERA_EVM_OPERATOR_PRIVATE_KEY!;
const MIRROR = process.env.HEDERA_MIRROR_NODE_URL!;
const VUSD_TOKEN_ID = process.env.HEDERA_VUSD_TOKEN_ID!;
const VUSD_DECIMALS = 6;
const FRACTION_SIZE = 10; // 1 iToken = 10 vUSD

/* ===== ETHERS ===== */
const provider = new ethers.JsonRpcProvider(RPC_URL, { name: "hedera-testnet", chainId: 296 });
const signer = new ethers.Wallet(HEDERA_EVM_OPERATOR_PRIVATE_KEY, provider);

/* ===== SDK ===== */
const operatorId = AccountId.fromString(HEDERA_EVM_OPERATOR_ID);
const operatorKey = PrivateKey.fromStringECDSA(HEDERA_EVM_OPERATOR_PRIVATE_KEY);
const hederaClient = Client.forTestnet().setOperator(operatorId, operatorKey);

/* ===== HELPERS ===== */
function idToEvmAddress(id: string): string {
    if (id.startsWith("0x")) return ethers.getAddress(id);
    const [shardStr, realmStr, numStr] = id.split(".");
    const shard = BigInt(shardStr),
        realm = BigInt(realmStr),
        num = BigInt(numStr);
    const hex =
        shard.toString(16).padStart(8, "0") +
        realm.toString(16).padStart(16, "0") +
        num.toString(16).padStart(16, "0");
    return ethers.getAddress("0x" + hex);
}

function normalizeAccountIdOrAddr(account: string): string {
    return account.startsWith("0x") ? ethers.getAddress(account) : idToEvmAddress(account);
}

async function getEscrowContract(escrowEvm: string) {
    return new ethers.Contract(ethers.getAddress(escrowEvm), ESCROW_ABI, signer);
}

async function ensureOwner(escrow: ethers.Contract) {
    try {
        const [owner, signerAddr] = await Promise.all([escrow.owner(), signer.getAddress()]);
        if (owner.toLowerCase() !== signerAddr.toLowerCase()) {
            console.warn(`⚠️ Signer ${signerAddr} is not contract owner ${owner}. onlyOwner functions may revert.`);
        }
    } catch {
        /* ignore */
    }
}

async function tryAssociateToken(escrow: ethers.Contract, tokenEvm: string) {
    try {
        const tx = await escrow.associateWithToken(tokenEvm);
        await tx.wait();
    } catch (e: any) {
        const msg = String(e?.message || e);
        if (!/already|ALREADY|TOKEN_ALREADY_ASSOCIATED|revert/i.test(msg)) {
            console.log("assoc warn:", msg);
        }
    }
}

function normalizeTxId(txId: string) {
    if (txId.includes("-")) return txId;
    if (txId.includes("@")) {
        const [acc, ts] = txId.split("@");
        const [sec, nanoRaw] = ts.split(".");
        const nano = (nanoRaw || "0").padEnd(9, "0").slice(0, 9);
        return `${acc}-${sec}-${nano}`;
    }
    return txId;
}

async function pollTx(txId: string, tries = 8, delayMs = 1000) {
    const norm = normalizeTxId(txId);
    for (let i = 0; i < tries; i++) {
        try {
            const url = `${MIRROR}/v1/transactions/${norm}`;
            const { data } = await axios.get(url);
            const tx = Array.isArray(data.transactions) ? data.transactions[0] : data;
            if (tx?.result) return tx;
        } catch { /* ignore */ }
        await new Promise((r) => setTimeout(r, delayMs));
    }
    throw new Error("Transaction not found on mirror (timeout)");
}

function extractVusdAmountFromTx(
    tx: any,
    accountId: string,
    escrowAccountId: string,
    vusdTokenId: string,
    decimals = 6
) {
    if (tx.result !== "SUCCESS") throw new Error(`Tx not successful: ${tx.result}`);
    const rows: any[] = Array.isArray(tx.token_transfers) ? tx.token_transfers : [];
    if (rows.length === 0) throw new Error("No token_transfers in tx");

    const vusdRows = rows.filter((r) => r.token_id === vusdTokenId);
    if (vusdRows.length === 0) {
        const seen = [...new Set(rows.map((r) => r.token_id))].join(", ");
        throw new Error(`No vUSD transfers in tx. Saw tokens: ${seen}`);
    }

    const investorDebit = vusdRows.find((r) => r.account === accountId && Number(r.amount) < 0);
    const escrowCredit = vusdRows.find((r) => r.account === escrowAccountId && Number(r.amount) > 0);
    if (!investorDebit || !escrowCredit) throw new Error("Expected investor→escrow vUSD transfer not found");

    const debitUnits = Math.abs(Number(investorDebit.amount));
    const creditUnits = Number(escrowCredit.amount);
    if (debitUnits !== creditUnits) throw new Error("Transfer mismatch (amounts differ)");

    return { units: debitUnits, vusdAmount: debitUnits / 10 ** decimals };
}

async function getEscrowForToken(tokenIdOrEvm: string) {
    const asset =
        (await AssetModel.findOne({ tokenId: tokenIdOrEvm }).lean()) as AssetDoc | null ||
        (await AssetModel.findOne({
            tokenEvm: tokenIdOrEvm.startsWith("0x")
                ? ethers.getAddress(tokenIdOrEvm)
                : undefined,
        }).lean() as AssetDoc | null);

    if (!asset) throw new Error(`Asset not found for token ${tokenIdOrEvm}`);

    if (asset.escrowEvm) {
        return {
            escrowEvm: ethers.getAddress(asset.escrowEvm),
            tokenEvm: asset.tokenEvm || idToEvmAddress(asset.tokenId!),
        };
    }

    if (!asset.escrowContractId)
        throw new Error(`Asset ${asset._id} missing escrowContractId`);

    const parts = String(asset.escrowContractId).split(".");
    if (parts.length !== 3 || /[a-f]/i.test(parts[2])) {
        throw new Error(`Invalid escrowContractId format: ${asset.escrowContractId}`);
    }

    const escrowEvm = idToEvmAddress(asset.escrowContractId);
    const tokenEvm = asset.tokenEvm || idToEvmAddress(asset.tokenId!);
    return { escrowEvm, tokenEvm };
}

/* ===== SERVICE ===== */
class InvestmentService {
    async investFromDeposit(
        { accountId, investorId }: { accountId: string; investorId: string },
        params: { assetId: string; txId: string }
    ) {
        const { assetId, txId } = params;

        const asset = (await AssetModel.findById(assetId).lean()) as AssetDoc | null;

        if (!asset) throw new Error("Asset not found");
        if (!asset.tokenId || !asset.tokenEvm) throw new Error("Asset not tokenized");
        if (!asset.escrowEvm && !asset.escrowContractId) throw new Error("Missing escrow reference");

        const escrowEvm = asset.escrowEvm || idToEvmAddress(String(asset.escrowContractId));
        const tokenEvm = asset.tokenEvm;

        const escrow = await getEscrowContract(escrowEvm);
        await ensureOwner(escrow);

        const mirrorTx = await pollTx(txId);
        const { units: vusdUnits, vusdAmount } = extractVusdAmountFromTx(
            mirrorTx,
            accountId,
            VUSD_TOKEN_ID,
            VUSD_TOKEN_ID,
            VUSD_DECIMALS
        );

        const min = Number(asset.minInvestment ?? 0);
        const max = Number(asset.maxInvestment ?? 0);
        if (min && vusdAmount < min) throw new Error(`Below minimum (${min} vUSD)`);
        if (max && vusdAmount > max) throw new Error(`Above maximum (${max} vUSD)`);
        if (vusdAmount % FRACTION_SIZE !== 0)
            throw new Error(`Amount must be a multiple of ${FRACTION_SIZE} vUSD`);

        const agg = await InvestmentModel.aggregate([
            { $match: { tokenId: asset.tokenId } },
            { $group: { _id: null, funded: { $sum: "$vusdAmount" } } },
        ]);
        const funded = Number(agg[0]?.funded ?? 0);
        const totalTarget = Number(asset.totalTarget ?? 0);
        if (totalTarget && funded + vusdAmount > totalTarget) {
            throw new Error("This purchase would exceed pool target");
        }

        const iTokenAmount = Math.floor(vusdAmount / FRACTION_SIZE);
        if (iTokenAmount <= 0) throw new Error("Calculated iTokenAmount=0");

        await tryAssociateToken(escrow, tokenEvm);

        const investorEvm = normalizeAccountIdOrAddr(accountId);
        const tx1 = await escrow.releaseIToken(investorEvm, tokenEvm, iTokenAmount);
        await tx1.wait();

        const tx2 = await escrow.recordInvestment(investorEvm, tokenEvm, BigInt(vusdUnits));
        await tx2.wait();

        const len = await escrow.investmentsLength(investorEvm);
        const contractIndex = Number(len) - 1;

        const yieldRate = Number(asset.yieldRate ?? 0.1);
        const expectedYield = Number(vusdAmount) * yieldRate;
        const maturedAt = new Date(Date.now() + (asset.durationDays ?? 90) * 86400000);

        const investment = await InvestmentModel.create({
            investorId,
            investorEvm,
            tokenId: asset.tokenId,
            tokenEvm,
            assetType: asset.assetType,
            assetRef: asset._id,
            vusdAmount,
            iTokenAmount,
            yieldRate,
            expectedYield,
            contractIndex,
            txId: tx2.hash,
            depositTxId: normalizeTxId(txId),
            maturedAt,
        });

        await new TopicMessageSubmitTransaction()
            .setTopicId(HCS_TOPIC_ID)
            .setMessage(
                JSON.stringify({
                    event: "INVESTMENT_RECORDED",
                    investorId,
                    tokenId: asset.tokenId,
                    tokenEvm,
                    escrowEvm,
                    assetType: asset.assetType,
                    vusdAmount,
                    iTokenAmount,
                    yieldRate,
                    expectedYield,
                    depositTxId: normalizeTxId(txId),
                    txId: tx2.hash,
                    timestamp: new Date(),
                })
            )
            .execute(hederaClient);

        return { success: true, investment };
    }

    async getAllInvestments() {
        return await InvestmentModel.find().sort({ createdAt: -1 }).lean();
    }

    async getInvestmentsByInvestor(investorId: string) {
        return await InvestmentModel.find({ investorId }).sort({ createdAt: -1 }).lean();
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
            const yieldUnits = BigInt(Math.round(Number(inv.expectedYield) * 10 ** 6));

            console.log(`💸 Settling yield for asset ${inv.assetType} via escrow ${escrowEvm}`);

            const tx = await escrow.settleInvestment(investorEvm, inv.contractIndex, yieldUnits);
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
                        expectedYield: inv.expectedYield,
                        escrowEvm,
                        txId: tx.hash,
                        paidAt: new Date(),
                    })
                )
                .execute(hederaClient);
        }

        return { settled };
    }
}

export default new InvestmentService();