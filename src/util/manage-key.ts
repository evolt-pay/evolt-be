import { PrivateKey } from "@hashgraph/sdk";
import { getCrypto, secretClient } from "./azure-key-vault.util";

const SECRET_PREFIX = "hedera-user-key-";

export async function storeUserKey(userId: string, privateKey: PrivateKey) {
    const crypto = await getCrypto();
    const raw = Buffer.from(privateKey.toBytesRaw()); // ED25519 bytes
    const wrapped = await crypto.wrapKey("RSA-OAEP-256", raw); // HSM operation
    const b64 = Buffer.from(wrapped.result!).toString("base64");

    await secretClient.setSecret(`${SECRET_PREFIX}${userId}`, b64);
}

export async function getUserKey(userId: string): Promise<PrivateKey> {
    const sec = await secretClient.getSecret(`${SECRET_PREFIX}${userId}`);
    if (!sec.value) throw new Error("Secret missing");
    const crypto = await getCrypto();
    const wrapped = Buffer.from(sec.value, "base64");
    const unwrapped = await crypto.unwrapKey("RSA-OAEP-256", wrapped);
    return PrivateKey.fromBytesED25519(unwrapped.result!);
}