import { Client, TransferTransaction, TokenId } from "@hashgraph/sdk";
import dotenv from "dotenv";
dotenv.config();

const client = Client.forTestnet()
    .setOperator(process.env.HEDERA_OPERATOR_ID!, process.env.HEDERA_OPERATOR_KEY!);

async function transferVUSD() {
    const tokenId = TokenId.fromString("0.0.7029847");
    const treasury = process.env.HEDERA_OPERATOR_ID!;
    const userWallet = "0.0.7063766"; //  wallet ID
    const amount = 1000 * 1e6; // 1,000 vUSD (6 decimals)

    const tx = await new TransferTransaction()
        .addTokenTransfer(tokenId, treasury, -amount)
        .addTokenTransfer(tokenId, userWallet, amount)
        .execute(client);

    const receipt = await tx.getReceipt(client);
    console.log("✅ Sent 1,000 vUSD to user:", receipt.status.toString());
}

transferVUSD().catch(console.error);