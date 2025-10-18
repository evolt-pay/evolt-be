import {
    AccountId,
    Client,
    FileCreateTransaction,
    FileAppendTransaction,
    FileContentsQuery,
    ContractCreateTransaction,
    ContractExecuteTransaction,
    ContractCallQuery,
    ContractFunctionParameters,
    Hbar,
    PrivateKey,
} from "@hashgraph/sdk";
import fs from "fs";
import crypto from "crypto";
import dotenv from "dotenv";
dotenv.config();

async function sha256(buf: Uint8Array | Buffer) {
    return crypto.createHash("sha256").update(buf).digest("hex");
}

async function main() {
    // 0) ENV & client
    const operatorId = AccountId.fromString(process.env.HEDERA_EVM_OPERATOR_ID!);
    const operatorKey = PrivateKey.fromStringECDSA(process.env.HEDERA_EVM_OPERATOR_KEY!);
    const vusdAddress = process.env.HEDERA_VUSD_EVM_ADDRESS!;
    if (!vusdAddress || !vusdAddress.startsWith("0x") || vusdAddress.length !== 42) {
        throw new Error("HEDERA_VUSD_EVM_ADDRESS must be a valid 0x-prefixed 42-character address.");
    }

    const client = Client.forTestnet().setOperator(operatorId, operatorKey);
    console.log("🚀 Deploying VoltEscrow (chunked upload + verify + initialize)…");

    // 1) Load **creation** bytecode (hex string) and convert to raw bytes
    const rawHex = fs.readFileSync("contracts/VoltEscrow.bin", "utf8").trim();
    const hex = rawHex.startsWith("0x") ? rawHex.slice(2) : rawHex;
    if (!/^[0-9a-fA-F]*$/.test(hex)) {
        throw new Error("contracts/VoltEscrow.bin contains non-hex characters.");
    }
    const bytecode = Buffer.from(hex, "hex");
    console.log(`📦 Local creation bytecode: ${bytecode.length} bytes`);
    const localHash = await sha256(bytecode);
    console.log("🔍 Local SHA-256:", localHash);

    // 2) Create HFS file
    const fileCreate = await new FileCreateTransaction()
        .setKeys([operatorKey.publicKey]) // you own the file
        .setMaxTransactionFee(new Hbar(5))
        .execute(client);
    const fileCreateRx = await fileCreate.getReceipt(client);
    const fileId = fileCreateRx.fileId!;
    console.log("📄 HFS file created:", fileId.toString());

    // 3) Append bytes in safe 4096-byte chunks
    const CHUNK = 4096;
    for (let i = 0; i < bytecode.length; i += CHUNK) {
        const chunk = bytecode.slice(i, i + CHUNK);
        const append = await new FileAppendTransaction()
            .setFileId(fileId)
            .setContents(chunk)
            .setMaxTransactionFee(new Hbar(5))
            .execute(client);
        await append.getReceipt(client);
        console.log(`📤 Uploaded chunk ${Math.floor(i / CHUNK) + 1}`);
    }

    // 4) Read back & verify integrity
    const remoteBytes = await new FileContentsQuery().setFileId(fileId).execute(client);
    console.log("📥 Downloaded from HFS:", remoteBytes.length, "bytes");
    const remoteHash = await sha256(remoteBytes);
    console.log("🔍 Remote SHA-256:", remoteHash);
    if (remoteHash !== localHash) {
        throw new Error("❌ HFS file mismatch. Aborting before deployment.");
    }
    console.log("✅ HFS file verified. Proceeding…");

    // 5) Create contract **from file** (no constructor args)
    const create = await new ContractCreateTransaction()
        .setBytecodeFileId(fileId)
        .setGas(3_000_000)
        // optional admin key (lets you upgrade via system contract flows, etc.)
        .setAdminKey(operatorKey.publicKey)
        .execute(client);
    const createRx = await create.getReceipt(client);
    const contractId = createRx.contractId!;
    console.log("🎉 Contract created:", contractId.toString());
    console.log("💫 EVM Address:", contractId.toEvmAddress());

    // 6) Initialize vUSD token address on-chain via onlyOwner
    console.log("⚙️  Setting vUSD token address via updateVusdToken()…");
    const initTx = await new ContractExecuteTransaction()
        .setContractId(contractId)
        .setGas(120_000)
        .setFunction("updateVusdToken", new ContractFunctionParameters().addAddress(vusdAddress))
        .execute(client);
    const initRx = await initTx.getReceipt(client);
    console.log("✅ updateVusdToken status:", initRx.status.toString());

    // 7) Read back public variable to confirm
    console.log("🔎 Reading vusdToken()…");
    const read = await new ContractCallQuery()
        .setContractId(contractId)
        .setGas(100_000)
        .setFunction("vusdToken")
        .setQueryPayment(new Hbar(2))
        .execute(client);

    // abi-encoded single address at slot 0
    const vusdOnChain = read.getAddress(0);
    console.log("✅ vusdToken() on-chain:", vusdOnChain);
}

main().catch((err) => {
    console.error("❌ Deployment failed:", err);
    process.exit(1);
});