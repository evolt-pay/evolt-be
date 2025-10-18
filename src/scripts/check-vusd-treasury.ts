import { Client, AccountBalanceQuery } from "@hashgraph/sdk";
import dotenv from "dotenv";
dotenv.config();

async function main() {
    const client = Client.forTestnet()
        .setOperator(process.env.HEDERA_OPERATOR_ID!, process.env.HEDERA_OPERATOR_KEY!);

    const treasuryId = process.env.HEDERA_OPERATOR_ID!;
    const vusdId = "0.0.7029847";

    const balance = await new AccountBalanceQuery()
        .setAccountId(treasuryId)
        .execute(client);

    const vusdBalance = balance?.tokens?._map.get(vusdId)?.toString();
    console.log(`🏦 Treasury vUSD balance: ${parseFloat(vusdBalance || "0") / 1e6} vUSD`);
}

main().catch(console.error);