import {
    Client,
    TokenId,
    TokenMintTransaction,
    TransferTransaction,
    TransactionReceipt,
} from "@hashgraph/sdk";
import { normalizeTxId } from "../util/util.hedera.js";
import axios from "axios";

const OPERATOR_ID = process.env.HEDERA_OPERATOR_ID!;
const OPERATOR_KEY = process.env.HEDERA_OPERATOR_KEY!;
const MIRROR = process.env.HEDERA_MIRROR_NODE_URL!;
const VUSD_TOKEN_ID = process.env.HEDERA_VUSD_TOKEN_ID!;
const USDC_TOKEN_ID = process.env.HEDERA_USDC_TOKEN_ID!;
const USDT_TOKEN_ID = process.env.HEDERA_USDT_TOKEN_ID!;

const DECIMALS = { VUSD: 6, USDC: 6, USDT: 6 } as const;
const TREASURY = OPERATOR_ID;

const client = Client.forTestnet().setOperator(OPERATOR_ID, OPERATOR_KEY);

const TOKENS = {
    USDC: TokenId.fromString(USDC_TOKEN_ID),
    USDT: TokenId.fromString(USDT_TOKEN_ID),
    VUSD: TokenId.fromString(VUSD_TOKEN_ID),
};

const toUnits = (amt: number, sym: keyof typeof DECIMALS) =>
    Math.round(Number(amt) * 10 ** DECIMALS[sym]);

class SwapService {


    private async verifyTransfer({
        txId,
        tokenId,
        from,
        to,
        expectedUnits,
    }: {
        txId: string;
        tokenId: string;
        from: string;
        to: string;
        expectedUnits: number;
    }) {
        console.log(expectedUnits, 'expectedUnits')
        const normalizedTxId = normalizeTxId(txId);
        const url = `${MIRROR}/v1/transactions/${encodeURIComponent(normalizedTxId)}`;
        const { data } = await axios.get(url);
        console.log(data, 'from mirror node')
        const tx = Array.isArray(data.transactions) ? data.transactions[0] : data;
        if (!tx || tx.result !== "SUCCESS") throw new Error("Transaction not confirmed");

        const transfers = (tx.token_transfers || []).filter((t: any) => t.token_id === tokenId);
        const debit = transfers.find((t: any) => t.account === from && Number(t.amount) === -expectedUnits);
        const credit = transfers.find((t: any) => t.account === to && Number(t.amount) === expectedUnits);
        if (!debit || !credit) throw new Error("Transfer mismatch (amount or accounts)");

        return true;
    }

    private async transferOrMintVUSD({ to, amount }: { to: string; amount: number }) {
        const vusdUnits = toUnits(amount, "VUSD");
        try {
            const tx = await new TransferTransaction()
                .addTokenTransfer(TOKENS.VUSD, TREASURY, -vusdUnits)
                .addTokenTransfer(TOKENS.VUSD, to, vusdUnits)
                .execute(client);
            await tx.getReceipt(client);
            return { minted: false, transferred: true };
        } catch {
            const mint = await new TokenMintTransaction()
                .setTokenId(TOKENS.VUSD)
                .setAmount(vusdUnits)
                .execute(client);
            await mint.getReceipt(client);

            const pay = await new TransferTransaction()
                .addTokenTransfer(TOKENS.VUSD, TREASURY, -vusdUnits)
                .addTokenTransfer(TOKENS.VUSD, to, vusdUnits)
                .execute(client);
            await pay.getReceipt(client);
            return { minted: true, transferred: true };
        }
    }

    /* =======================================================
       💰 DEPOSIT FLOW (USDC/USDT → vUSD)
    ======================================================= */

    async prepareDeposit({
        accountId,
        amount,
        token,
    }: { accountId: string; amount: number; token: "USDC" | "USDT"; }) {
        if (!["USDC", "USDT"].includes(token)) throw new Error("Unsupported token");
        if (!Number.isFinite(amount) || amount <= 0) throw new Error("Invalid amount");

        return {
            accountId,
            token,
            amount,
            treasury: TREASURY,
            message: `Send ${amount} ${token} to treasury ${TREASURY} to receive vUSD.`,
        };
    }

    async settleDeposit({
        investorAccountId,
        token,
        amount,
        txId,
    }: { investorAccountId: string; token: "USDC" | "USDT"; amount: number; txId: string; }) {
        const tokenId = token === "USDC" ? USDC_TOKEN_ID : USDT_TOKEN_ID;
        const expected = toUnits(amount, token);

        await this.verifyTransfer({
            txId,
            tokenId,
            from: investorAccountId,
            to: TREASURY,
            expectedUnits: expected,
        });

        const result = await this.transferOrMintVUSD({ to: investorAccountId, amount });
        return { success: true, direction: "deposit", data: result };
    }

    /* =======================================================
       💸 WITHDRAW FLOW (vUSD → USDC/USDT)
    ======================================================= */

    async prepareWithdraw({
        accountId,
        amount,
        token,
    }: { accountId: string; amount: number; token: "USDC" | "USDT"; }) {
        if (!["USDC", "USDT"].includes(token)) throw new Error("Unsupported token");
        if (!Number.isFinite(amount) || amount <= 0) throw new Error("Invalid amount");

        return {
            accountId,
            token,
            amount,
            treasury: TREASURY,
            message: `Send ${amount} vUSD to treasury ${TREASURY} to receive ${token}.`,
        };
    }

    async settleWithdraw({
        investorAccountId,
        token,
        amount,
        txId,
    }: { investorAccountId: string; token: "USDC" | "USDT"; amount: number; txId: string; }) {
        const vusdUnits = toUnits(amount, "VUSD");

        await this.verifyTransfer({
            txId,
            tokenId: VUSD_TOKEN_ID,
            from: investorAccountId,
            to: TREASURY,
            expectedUnits: vusdUnits,
        });

        const tokenId = token === "USDC" ? TOKENS.USDC : TOKENS.USDT;
        const stableUnits = toUnits(amount, token);

        const tx = await new TransferTransaction()
            .addTokenTransfer(tokenId, TREASURY, -stableUnits)
            .addTokenTransfer(tokenId, investorAccountId, stableUnits)
            .execute(client);

        const receipt: TransactionReceipt = await tx.getReceipt(client);
        if (receipt.status.toString() !== "SUCCESS") {
            throw new Error("Stablecoin transfer failed");
        }
        console.log(receipt.status.toString(),)
        console.log(tx.transactionId.toString())
        return { success: true, direction: "withdraw", txId: tx.transactionId.toString() };
    }
}

export default new SwapService();