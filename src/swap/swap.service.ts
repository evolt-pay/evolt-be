import {
    AccountId,
    Client,
    TokenId,
    TokenMintTransaction,
    TransactionId,
    TransferTransaction,
} from "@hashgraph/sdk";
import axios from "axios";

const OPERATOR_ID = process.env.HEDERA_OPERATOR_ID!;
const OPERATOR_KEY = process.env.HEDERA_OPERATOR_KEY!;
const MIRROR = process.env.HEDERA_MIRROR;

const VUSD_TOKEN_ID = process.env.HEDERA_VUSD_TOKEN_ID!;
const USDC_TOKEN_ID = process.env.HCS_TOPIC_ID!;
const USDT_TOKEN_ID = process.env.HCS_TOPIC_ID!;
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

export class SwapService {



    async prepareSwap({
        accountId,
        amount,
    }: { accountId: string; amount: number; }) {
        const token = "USDC";
        if (!["USDC", "USDT"].includes(token)) throw new Error("Unsupported token");
        if (!Number.isFinite(amount) || amount <= 0) throw new Error("Invalid amount");

        const payer = AccountId.fromString(accountId);
        const tokenId = TokenId.fromString("0.0.7029847");
        const units = toUnits(amount, token);


        const treasury = process.env.HEDERA_OPERATOR_ID!;

        const trf = await new TransferTransaction()
            .addTokenTransfer(tokenId, treasury, -units)
            .addTokenTransfer(tokenId, payer, units)
            .setTransactionMemo(`Sandbox airdrop vUSD → ${accountId}`)
            .execute(client);

        const receipt = await trf.getReceipt(client);
        console.log(`✅ Sent 1,000 vUSD to user: ${accountId}`, receipt.status.toString());

        return {
            accountId,
            token,
            amount,
            vusdAmount: amount,
            txId: trf.transactionId?.toString(),
            treasury: TREASURY,
        };
    }


    async settleSwap({
        investorAccountId,
        token,
        amount,
        txId,
    }: { investorAccountId: string; token: "USDC" | "USDT"; amount: number; txId: string; }) {
        const url = `${MIRROR}/api/v1/transactions/${encodeURIComponent(txId)}?expand=transfers`;
        const { data } = await axios.get(url);
        const tx = Array.isArray(data.transactions) ? data.transactions[0] : data;
        if (!tx || tx.result !== "SUCCESS") {
            throw new Error("Stablecoin transfer not confirmed");
        }

        const tokenId = token === "USDC" ? USDC_TOKEN_ID : USDT_TOKEN_ID;
        const expected = toUnits(amount, token);

        const tTransfers = (tx.token_transfers || []).filter((t: any) => t.token_id === tokenId);
        const userDebit = tTransfers.find((t: any) => t.account === investorAccountId && Number(t.amount) === -expected);
        const treasCredit = tTransfers.find((t: any) => t.account === TREASURY && Number(t.amount) === expected);
        if (!userDebit || !treasCredit) {
            throw new Error("Transfer mismatch (amount or accounts)");
        }

        const vusdUnits = toUnits(amount, "VUSD");

        try {
            const tx = await new TransferTransaction()
                .addTokenTransfer(TOKENS.VUSD, TREASURY, -vusdUnits)
                .addTokenTransfer(TOKENS.VUSD, investorAccountId, vusdUnits)
                .freezeWith(client)
                .execute(client);
            await tx.getReceipt(client);
            return { minted: false, transferred: true };
        } catch (e: any) {
            const mint = await new TokenMintTransaction()
                .setTokenId(TOKENS.VUSD)
                .setAmount(vusdUnits)
                .freezeWith(client)
                .execute(client);
            await mint.getReceipt(client);

            const pay = await new TransferTransaction()
                .addTokenTransfer(TOKENS.VUSD, TREASURY, -vusdUnits)
                .addTokenTransfer(TOKENS.VUSD, investorAccountId, vusdUnits)
                .freezeWith(client)
                .execute(client);
            await pay.getReceipt(client);
            return { minted: true, transferred: true };
        }
    }
}

export default new SwapService();