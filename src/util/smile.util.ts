import crypto from "crypto";

const PARTNER_ID = process.env.SMILE_ID_PARTNER_ID!;
const API_KEY = process.env.SMILE_ID_API_KEY!;

export class SmileUtil {
    /**
     * Generate a signature to initiate a Smile ID request
     * @param timestamp Current timestamp in ISO format
     * @param requestType Usually "sid_request" for requests
     * @returns base64-encoded signature
     */
    static generateSignature(
        timestamp: string,
    ): string {
        const hmac = crypto.createHmac("sha256", API_KEY);
        hmac.update(timestamp, "utf8");
        hmac.update(PARTNER_ID, "utf8");
        hmac.update('sid_request', "utf8");

        return hmac.digest("base64");
    }

    /**
     * Confirm that a Smile ID callback signature is valid
     * @param receivedSignature Signature received from Smile callback
     * @param receivedTimestamp Timestamp received from Smile callback
     * @param requestType Usually "sid_request" for requests
     * @returns boolean indicating whether signature is valid
     */
    static confirmSignature(
        receivedSignature: string,
        receivedTimestamp: string,
    ): boolean {
        const generatedSignature = this.generateSignature(receivedTimestamp);

        return generatedSignature === receivedSignature;
    }

    /**
     * Helper to get partner ID (optional)
     */
    static getPartnerId(): string {
        return PARTNER_ID;
    }

    /**
     * Helper to get API key (optional)
     */
    static getApiKey(): string {
        return API_KEY;
    }
}