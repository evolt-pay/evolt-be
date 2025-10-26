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
        const normalizedTxId = normalizeTxId(txId);
        const url = `${MIRROR}/v1/transactions/${encodeURIComponent(normalizedTxId)}`;

        try {
            const { data } = await axios.get(url);
            const tx = Array.isArray(data.transactions) ? data.transactions[0] : data;

            if (!tx) {
                return { ok: false, code: "TX_NOT_FOUND", message: "Transaction not found on mirror node yet." };
            }

            if (tx.result !== "SUCCESS") {
                return { ok: false, code: "TX_NOT_CONFIRMED", message: `Transaction not confirmed: ${tx.result}` };
            }

            const transfers = (tx.token_transfers || []).filter(
                (t: any) => t.token_id === tokenId
            );

            if (!transfers.length) {
                return { ok: false, code: "NO_TOKEN_TRANSFER", message: "Transaction does not involve expected token." };
            }

            const debit = transfers.find((t: any) => t.account === from && Number(t.amount) === -expectedUnits);
            const credit = transfers.find((t: any) => t.account === to && Number(t.amount) === expectedUnits);

            if (!debit || !credit) {
                return { ok: false, code: "TRANSFER_MISMATCH", message: "Transfer amount or accounts do not match expected." };
            }

            return { ok: true };

        } catch (err: any) {
            if (err?.response?.status === 404) {
                return { ok: false, code: "TX_NOT_FOUND", message: "Transaction not found (404)." };
            }
            return { ok: false, code: "MIRROR_ERROR", message: "Error communicating with mirror node.", detail: err.message };
        }
    }

    private async isAssociated(accountId: string, tokenId: string): Promise<boolean> {
        try {
            const { data } = await axios.get(`${MIRROR}/v1/accounts/${accountId}`);
            const tokens = data?.balance?.tokens ?? [];
            return tokens.some((t: any) => t.token_id === tokenId);
        } catch {
            return false;
        }
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
        DEPOSIT FLOW (USDC/USDT → vUSD)
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

        const res = await this.verifyTransfer({
            txId,
            tokenId,
            from: investorAccountId,
            to: TREASURY,
            expectedUnits: expected,
        });
        console.log(res)
        const result = await this.transferOrMintVUSD({ to: investorAccountId, amount });
        return { success: true, direction: "deposit", data: result };
    }

    /* =======================================================
        WITHDRAW FLOW (vUSD → USDC/USDT)
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


    async faucetUSDC({
        accountId,
        amount,
    }: {
        accountId: string;
        amount: number;
    }) {
        if (!Number.isFinite(amount) || amount <= 0) throw new Error("Invalid amount");

        // Ensure user is associated to USDC token (or auto-association enabled)
        const associated = await this.isAssociated(accountId, USDC_TOKEN_ID);
        if (!associated) {
            throw new Error(
                `Account ${accountId} is not associated with USDC (${USDC_TOKEN_ID}). ` +
                `Please associate the token (or enable auto-association) and try again.`
            );
        }

        const units = toUnits(amount, "USDC");

        try {
            const tx = await new TransferTransaction()
                .addTokenTransfer(TOKENS.USDC, TREASURY, -units)
                .addTokenTransfer(TOKENS.USDC, accountId, units)
                .setTransactionMemo(`USDC faucet ${amount} → ${accountId}`)
                .execute(client);

            const rcpt: TransactionReceipt = await tx.getReceipt(client);
            return {
                success: true,
                minted: false,
                txId: tx.transactionId.toString(),
                status: rcpt.status.toString(),
            };
        } catch (e: any) {
            const mint = await new TokenMintTransaction().setTokenId(TOKENS.USDC).setAmount(units).execute(client);
            await mint.getReceipt(client);

            const pay = await new TransferTransaction()
                .addTokenTransfer(TOKENS.USDC, TREASURY, -units)
                .addTokenTransfer(TOKENS.USDC, accountId, units)
                .setTransactionMemo(`USDC faucet ${amount} → ${accountId}`)
                .execute(client);

            const payRcpt: TransactionReceipt = await pay.getReceipt(client);
            return {
                success: true,
                minted: true,
                txId: pay.transactionId.toString(),
                status: payRcpt.status.toString(),
            };
        }
    }

}

export default new SwapService();