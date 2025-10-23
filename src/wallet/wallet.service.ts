import { PrivateKey } from "@hashgraph/sdk";
import { storeUserKey, getUserKey } from "../util/manage-key";
import crypto from "crypto";
import { FastifyInstance } from "fastify";

export class WalletService {
    constructor(private app: FastifyInstance) { }

    static async createWallet(userId: string) {
        try {
            const privateKey = PrivateKey.generateED25519();
            const publicKey = privateKey.publicKey;

            await storeUserKey(userId, privateKey);

            const alias = publicKey.toAccountId(0, 0);
            return {
                success: true,
                alias: alias.toString(),
                publicKey: publicKey.toStringRaw(),
                message: "Wallet created successfully! Fund this alias to activate.",
            };
        } catch (err: any) {
            console.error("WalletService.createWallet() failed:", err);
            throw new Error(`Wallet creation failed: ${err.message}`);
        }
    }

    static async getPrivateKey(userId: string): Promise<PrivateKey> {
        return await getUserKey(userId);
    }

    async initiateWalletConnect(phoneNumber: string) {
        const nonce = crypto.randomBytes(32).toString("hex");
        const challenge = `Evolt verification:\n\nSign this message to verify your wallet.\nNonce: ${nonce}`;
        const redisKey = `wallet_nonce:${phoneNumber}`;

        await this.app.redis.set(redisKey, nonce, "EX", 300);


        const encodedMessage = encodeURIComponent(challenge);
        const connectLink = `https://hashpack.app/sign?message=${encodedMessage}`;

        return { challenge, connectLink };
    }



}