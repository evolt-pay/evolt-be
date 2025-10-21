import {
    AccountId,
    Client,
    TokenId,
    TransferTransaction,
    TransactionReceipt,
} from "@hashgraph/sdk";
import axios from "axios";

const OPERATOR_ID = process.env.HEDERA_OPERATOR_ID!;
const OPERATOR_KEY = process.env.HEDERA_OPERATOR_KEY!;
const MIRROR = process.env.HEDERA_MIRROR!;

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

class WithdrawService {
    /**
     * Step 1: Verify that user sent vUSD back to treasury
     */
    async verifyVusdDeposit({
        accountId,
        amount,
        txId,
    }: {
        accountId: string;
        amount: number;
        txId: string;
    }) {
        const url = `${MIRROR}/api/v1/transactions/${encodeURIComponent(txId)}?expand=transfers`;
        const { data } = await axios.get(url);
        const tx = Array.isArray(data.transactions) ? data.transactions[0] : data;

        if (!tx || tx.result !== "SUCCESS") throw new Error("Transaction not confirmed");

        const vusdRows = (tx.token_transfers || []).filter(
            (t: any) => t.token_id === VUSD_TOKEN_ID
        );
        const userDebit = vusdRows.find(
            (t: any) => t.account === accountId && Number(t.amount) < 0
        );
        const treasuryCredit = vusdRows.find(
            (t: any) => t.account === TREASURY && Number(t.amount) > 0
        );

        if (!userDebit || !treasuryCredit) {
            throw new Error("vUSD deposit not detected");
        }

        const debitUnits = Math.abs(Number(userDebit.amount));
        const creditUnits = Number(treasuryCredit.amount);
        if (debitUnits !== creditUnits)
            throw new Error("Amount mismatch in transfer");

        const vusdAmount = debitUnits / 10 ** DECIMALS.VUSD;
        if (Math.abs(vusdAmount - amount) > 0.000001)
            throw new Error("Deposit amount mismatch");

        return { vusdUnits: debitUnits, vusdAmount };
    }

    /**
     * Step 2: Release equivalent stablecoin to user
     */
    async releaseStablecoin({
        investorAccountId,
        token,
        amount,
    }: {
        investorAccountId: string;
        token: "USDC" | "USDT";
        amount: number;
    }) {
        if (!["USDC", "USDT"].includes(token)) {
            throw new Error("Unsupported token for withdrawal");
        }

        const tokenId = TOKENS[token];
        const units = toUnits(amount, token);

        const tx = await new TransferTransaction()
            .addTokenTransfer(tokenId, TREASURY, -units)
            .addTokenTransfer(tokenId, investorAccountId, units)
            .setTransactionMemo(`Withdraw ${amount} ${token} to ${investorAccountId}`)
            .execute(client);

        const receipt: TransactionReceipt = await tx.getReceipt(client);
        if (receipt.status.toString() !== "SUCCESS") {
            throw new Error("Stablecoin transfer failed");
        }

        return {
            token,
            amount,
            txId: tx.transactionId.toString(),
            treasury: TREASURY,
        };
    }


    async withdraw({
        investorAccountId,
        token,
        amount,
        txId,
    }: {
        investorAccountId: string;
        token: "USDC" | "USDT";
        amount: number;
        txId: string;
    }) {
        // Step 1: Verify user has sent vUSD
        await this.verifyVusdDeposit({
            accountId: investorAccountId,
            amount,
            txId,
        });

        // Step 2: Send equivalent USDC/USDT
        const release = await this.releaseStablecoin({
            investorAccountId,
            token,
            amount,
        });

        return {
            success: true,
            message: `Withdrawal successful`,
            data: release,
        };
    }
}

export default new WithdrawService();