import {
    Client,
    TokenCreateTransaction,
    TokenType,
    TokenSupplyType,
    Hbar,
} from "@hashgraph/sdk";
import dotenv from "dotenv";
dotenv.config();

const client = Client.forTestnet().setOperator(
    process.env.HEDERA_OPERATOR_ID!,
    process.env.HEDERA_OPERATOR_KEY!
);

async function main() {
    const meta = {
        name: "Test Tether USD",
        symbol: "tUSDT",
        peg: "1 tUSDT = 1 USD",
        network: "testnet",
    };

    const tx = await new TokenCreateTransaction()
        .setTokenName("Test Tether USD")
        .setTokenSymbol("tUSDT")
        .setTokenType(TokenType.FungibleCommon)
        .setTreasuryAccountId(process.env.HEDERA_OPERATOR_ID!)
        .setInitialSupply(1_000_000 * 1e6)
        .setDecimals(6)
        .setSupplyType(TokenSupplyType.Finite)
        .setMaxSupply(10_000_000 * 1e6)
        .setAdminKey(client.operatorPublicKey!)
        .setSupplyKey(client.operatorPublicKey!)
        .setMaxTransactionFee(new Hbar(20))
        .setTransactionMemo("Test USDT token for VoltPay sandbox")
        .setMetadata(Buffer.from(JSON.stringify(meta), "utf8"))
        .execute(client);

    const receipt = await tx.getReceipt(client);
    console.log("✅ Test USDT created:", receipt.tokenId?.toString());
}

main().catch(console.error);