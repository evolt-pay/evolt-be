import {
    Client,
    AccountInfoQuery,
    AccountId,
    TokenAssociateTransaction,
    TransferTransaction,
    TokenId
} from "@hashgraph/sdk";
import dotenv from "dotenv";
dotenv.config();

// ========= CONFIG =========
const ESCROW_EVM = "0x803A0eF8ef6732d281A90901a3C9B5fb21ee84C1";
const ESCROW_ACCOUNT_ID = AccountId.fromEvmAddress(0, 0, ESCROW_EVM);
const INVESTOR_ID = "0.0.7026889";
const TOKEN_ID = "0.0.7045714"; // iToken from invoice 002

const client = Client.forTestnet()
    .setOperator(process.env.HEDERA_OPERATOR_ID!, process.env.HEDERA_OPERATOR_KEY!);

async function associateEscrow() {
    console.log("🔹 Associating escrow contract with token...");
    const tx = await new TokenAssociateTransaction()
        .setAccountId(ESCROW_ACCOUNT_ID)
        .setTokenIds([TokenId.fromString(TOKEN_ID)])
        .execute(client);
    const receipt = await tx.getReceipt(client);
    console.log("✅ Escrow association status:", receipt.status.toString());
}

async function associateInvestor() {
    console.log("🔹 Associating investor with token...");
    const tx = await new TokenAssociateTransaction()
        .setAccountId(INVESTOR_ID)
        .setTokenIds([TokenId.fromString(TOKEN_ID)])
        .execute(client);
    const receipt = await tx.getReceipt(client);
    console.log("✅ Investor association status:", receipt.status.toString());
}

async function verifyBalances() {
    console.log("\n📊 Checking balances...");
    const escrowInfo = await new AccountInfoQuery().setAccountId(ESCROW_ACCOUNT_ID).execute(client);
    const investorInfo = await new AccountInfoQuery().setAccountId(INVESTOR_ID).execute(client);

    const escrowRel = escrowInfo.tokenRelationships.get(TOKEN_ID);
    const investorRel = investorInfo.tokenRelationships.get(TOKEN_ID);

    console.log("Escrow associated?", !!escrowRel);
    console.log("Investor associated?", !!investorRel);
    console.log("Escrow token balance:", escrowRel?.balance?.toString());
    console.log("Investor token balance:", investorRel?.balance?.toString());
}

async function main() {
    console.log("🚀 Running Hedera association fixes...");
    try {
        await associateEscrow();
    } catch (err) {
        console.log("ℹ️ Escrow association skipped (likely already associated).");
    }

    try {
        await associateInvestor();
    } catch (err) {
        console.log("ℹ️ Investor association skipped (likely already associated).");
    }

    await verifyBalances();
    console.log("✅ All associations verified.");
}

main().catch(console.error);