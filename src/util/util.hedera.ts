import { PublicKey } from "@hashgraph/sdk";

/**
 * Verify a Hedera ED25519 signature
 * @param {string} message - Original message or nonce
 * @param {Uint8Array | string} signature - Signature (raw bytes or base64)
 * @param {string} publicKeyString - Hedera public key (DER-encoded)
 * @returns {boolean}
 */
export function verifyHederaSignature(
    message: string,
    signature: Uint8Array | string,
    publicKeyString: string
): boolean {
    try {
        const publicKey = PublicKey.fromString(publicKeyString);
        const messageBytes = Buffer.from(message, "utf8");

        const signatureBytes =
            typeof signature === "string" ? Buffer.from(signature, "base64") : signature;

        const isValid = publicKey.verify(messageBytes, signatureBytes);

        console.log(`🔍 Signature valid: ${isValid}`);
        return isValid;
    } catch (err) {
        console.error("❌ Signature verification failed:", err);
        return false;
    }
}