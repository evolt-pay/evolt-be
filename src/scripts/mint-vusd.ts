import {
    Client,
    TokenMintTransaction,
    TokenId,
    Hbar,
} from "@hashgraph/sdk";
import dotenv from "dotenv";
dotenv.config();

const client = Client.forTestnet()
    .setOperator(process.env.HEDERA_OPERATOR_ID!, process.env.HEDERA_OPERATOR_KEY!);

const VUSD_ID = TokenId.fromString(process.env.HEDERA_VUSD_TOKEN_ID || "0.0.7029847");

async function main() {
    const amount = 50_000 * 1e6;

    console.log(`🚀 Minting ${amount / 1e6} vUSD to treasury ${process.env.HEDERA_OPERATOR_ID}`);

    const tx = await new TokenMintTransaction()
        .setTokenId(VUSD_ID)
        .setAmount(amount)
        .setMaxTransactionFee(new Hbar(20))
        .execute(client);

    const receipt = await tx.getReceipt(client);
    console.log("✅ Mint successful!");
    console.log("New total supply:", receipt.totalSupply?.toString());
}

main().catch(console.error);