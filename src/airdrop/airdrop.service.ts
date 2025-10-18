import { Client, TransferTransaction, TokenId, AccountId } from "@hashgraph/sdk";

const OPERATOR_ID = process.env.HEDERA_OPERATOR_ID!;
const OPERATOR_KEY = process.env.HEDERA_OPERATOR_KEY!;
const VUSD_ID = process.env.VUSD_TOKEN_ID!;
const DECIMALS = 6;

const MAX_RECIPIENTS = Number(process.env.SANDBOX_AIRDROP_MAX_RECIPIENTS || 500);
const MAX_PER = Number(process.env.SANDBOX_AIRDROP_MAX_PER || 100000);

const client = Client.forTestnet().setOperator(OPERATOR_ID, OPERATOR_KEY);

export type AirdropRecipient = { accountId: string; amount?: number };
export type AirdropResult = {
    to: string;
    amount: number;
    status: "SUCCESS" | "FAILED";
    txId?: string;
    error?: string;
};

export class AirdropService {
    private toUnits(amount: number) {
        if (!Number.isFinite(amount) || amount <= 0) {
            throw new Error("amount must be > 0");
        }
        if (amount > MAX_PER) {
            throw new Error(`amount exceeds sandbox max per recipient (${MAX_PER})`);
        }
        return Math.round(amount * 10 ** DECIMALS);
    }

    async airdropVusd(input: { recipients: AirdropRecipient[]; defaultAmount?: number }) {
        const { recipients, defaultAmount = 100 } = input;

        if (!Array.isArray(recipients) || recipients.length === 0) {
            throw new Error("recipients[] is required");
        }
        if (recipients.length > MAX_RECIPIENTS) {
            throw new Error(`Too many recipients. Max is ${MAX_RECIPIENTS}`);
        }

        const tokenId = TokenId.fromString(VUSD_ID);

        const results: AirdropResult[] = [];
        for (const r of recipients) {
            const amount = Number(r.amount ?? defaultAmount);
            const to = r.accountId;

            try {
                const recipient = AccountId.fromString(to);
                const units = this.toUnits(amount);

                const tx = await new TransferTransaction()
                    .addTokenTransfer(tokenId, OPERATOR_ID, -units)
                    .addTokenTransfer(tokenId, recipient, units)
                    .setTransactionMemo(`Airdrop vUSD +${amount}`)
                    .execute(client);

                const rc = await tx.getReceipt(client);

                results.push({
                    to: recipient.toString(),
                    amount,
                    status: "SUCCESS",
                    txId: tx.transactionId.toString(),
                });
            } catch (e: any) {
                const msg = String(e?.message || e);
                const hint = msg.includes("TOKEN_NOT_ASSOCIATED")
                    ? "Recipient must associate VUSD first."
                    : undefined;

                results.push({
                    to,
                    amount,
                    status: "FAILED",
                    error: hint ? `${msg} — ${hint}` : msg,
                });
            }
        }

        const totalRequested = recipients.reduce((s, r) => s + Number(r.amount ?? defaultAmount), 0);
        const totalSucceeded = results.filter(r => r.status === "SUCCESS").length;
        const totalFailed = results.length - totalSucceeded;

        return {
            tokenId: VUSD_ID,
            totalRecipients: recipients.length,
            totalRequested,
            totalSucceeded,
            totalFailed,
            results,
        };
    }
}

export default new AirdropService();