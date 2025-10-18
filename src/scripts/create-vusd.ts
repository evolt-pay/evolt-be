import {
    Client,
    TokenCreateTransaction,
    TokenType,
    TokenSupplyType,
    Hbar,
} from "@hashgraph/sdk";
import dotenv from "dotenv";
dotenv.config();

const client = Client.forTestnet()
    .setOperator(process.env.HEDERA_OPERATOR_ID!, process.env.HEDERA_OPERATOR_KEY!);

async function main() {
    const meta = {
        name: "Volt USD",
        symbol: "vUSD",
        peg: "1 vUSD = 1 USD",
        decimals: 6,
        version: "1.0",
    };

    const tx = await new TokenCreateTransaction()
        .setTokenName("Volt USD")
        .setTokenSymbol("vUSD")
        .setTokenType(TokenType.FungibleCommon)
        .setTreasuryAccountId(process.env.HEDERA_OPERATOR_ID!)
        .setInitialSupply(1_000_000 * 1e6)   // 1,000,000 vUSD initial liquidity
        .setSupplyType(TokenSupplyType.Finite)
        .setMaxSupply(10_000_000 * 1e6)
        .setDecimals(6)
        .setAdminKey(client.operatorPublicKey!)
        .setSupplyKey(client.operatorPublicKey!)
        .setMaxTransactionFee(new Hbar(20))
        .setTransactionMemo("VoltPay stablecoin (testnet)")
        .setMetadata(Buffer.from(JSON.stringify(meta), "utf8"))
        .execute(client);

    const receipt = await tx.getReceipt(client);
    console.log("✅ vUSD created:", receipt.tokenId?.toString());
}

main().catch(console.error);