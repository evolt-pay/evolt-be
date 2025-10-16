import { PublicKey } from "@hashgraph/sdk";

/**
 * Verify a Hedera ED25519 signature
 * @param {string} message - Original message or nonce
 * @param {Uint8Array | string} signature - Signature (raw bytes or base64)
 * @param {string} publicKeyString - Hedera public key (DER-encoded)
 * @returns {boolean}
 */
export function verifyHederaSignature(
    publicKey: string,
    signature: string,
    message: string
): boolean {
    try {
        const publicKeyBytes = Buffer.from(publicKey, "base64");
        const signatureBytes = Buffer.from(signature, "base64");
        // 2️⃣ Convert to Hedera PublicKey instance
        const pubKey = PublicKey.fromBytes(publicKeyBytes);
        const prefix = "\x19Hedera Signed Message:\n";
        const messageBytes = Buffer.from(prefix + message.length + message, "utf8");
        console.log(messageBytes, 'messageBytes')
        return pubKey.verify(messageBytes, signatureBytes);
    } catch (err) {
        console.log("❌ Signature verification failed:", err);
        return false;
    }
}