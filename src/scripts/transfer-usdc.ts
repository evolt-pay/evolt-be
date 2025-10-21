import { Client, TransferTransaction, TokenId } from "@hashgraph/sdk";
import dotenv from "dotenv";
dotenv.config();

// ✅ Initialize Hedera client (Testnet)
const client = Client.forTestnet().setOperator(
    process.env.HEDERA_OPERATOR_ID!,
    process.env.HEDERA_OPERATOR_KEY!
);

async function transferUSDC() {
    try {
        // Replace with your actual token ID from create-usdc.ts
        const tokenId = TokenId.fromString(process.env.HEDERA_USDC_TOKEN_ID!);
        const treasury = process.env.HEDERA_OPERATOR_ID!;
        const userWallet = "0.0.7026889";
        const amount = 1000 * 1e6; // 💵 1,000 USDC (6 decimals)

        console.log(`🚀 Initiating USDC transfer:
    ├─ Token ID: ${tokenId.toString()}
    ├─ From Treasury: ${treasury}
    ├─ To: ${userWallet}
    └─ Amount: 1,000 USDC
    `);

        // 🔹 Execute transfer transaction
        const tx = await new TransferTransaction()
            .addTokenTransfer(tokenId, treasury, -amount)
            .addTokenTransfer(tokenId, userWallet, amount)
            .setTransactionMemo(`Transfer 1,000 USDC to ${userWallet}`)
            .execute(client);

        const receipt = await tx.getReceipt(client);
        console.log("✅ Transaction Status:", receipt.status.toString());
        console.log("🧾 Transaction ID:", tx.transactionId.toString());
    } catch (error: any) {
        console.error("❌ Transfer failed:", error.message || error);
    }
}

transferUSDC().catch(console.error);