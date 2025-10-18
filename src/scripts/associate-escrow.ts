import {
    Client,
    AccountId,
    PrivateKey,
    TokenAssociateTransaction
} from "@hashgraph/sdk";
import dotenv from "dotenv";
dotenv.config();

async function main() {
    // Use ECDSA operator for contract operations
    const evmOperatorId = AccountId.fromString(process.env.HEDERA_EVM_OPERATOR_ID!);
    const evmOperatorKey = PrivateKey.fromStringECDSA(process.env.HEDERA_EVM_OPERATOR_KEY!);

    const client = Client.forTestnet().setOperator(evmOperatorId, evmOperatorKey);

    const vusdTokenId = process.env.HEDERA_VUSD_TOKEN_ID!;
    const vaultAccountId = AccountId.fromString(process.env.VAULT_ADDRESS!);

    console.log("Associating VoltEscrow contract with tokens...");

    const associateTx = await new TokenAssociateTransaction()
        .setAccountId(vaultAccountId)
        .setTokenIds([vusdTokenId])
        .freezeWith(client)
        .sign(evmOperatorKey);

    const submit = await associateTx.execute(client);
    const receipt = await submit.getReceipt(client);

    console.log("✅ Association status:", receipt.status.toString());
}

main().catch(console.error);