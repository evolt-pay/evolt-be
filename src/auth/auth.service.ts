import { FastifyInstance } from "fastify";
import { httpErrors } from "@fastify/sensible";
import crypto from "crypto";
import investorService from "../investor/investor.service.js";
import { PublicKey } from "@hashgraph/sdk";


import UserService from "../user/user.service.js";
import UtilService from "../util/util.service.js";
import { ISendOtp, ISignup, IVerifyOtp, ISetPassword, ILogin } from "./auth.dto.js";
import { verifyHederaSignature } from "@util/util.hedera.js";

export default class AuthService {
    private challengeStore = new Map<string, string>();

    constructor(private app: FastifyInstance) { }

    /* ---------------- EMAIL AUTH FLOW (as before) ---------------- */
    async sendOtp({ email }: ISendOtp): Promise<void> {
        const user = await UserService.fetchOneUser({ email });
        if (user && user.isVerified) throw httpErrors.badRequest("Email already registered");

        const otp = UtilService.generateOtp();
        const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000);

        if (!user) {
            await UserService.createPendingUser({
                email,
                otp: { code: otp, expiresAt: otpExpiresAt, purpose: "emailVerification" },
            });
        } else {
            user.otp = { code: otp, expiresAt: otpExpiresAt, purpose: "emailVerification" };
            await (user as any).save();
        }

        await UtilService.sendEmail(email, "Your OTP Code", `Your OTP is ${otp}`);
    }

    async signup(data: ISignup): Promise<void> {
        const { email, password, accountType } = data;
        const existingUser = await UserService.fetchOneUser({ email });

        if (existingUser && existingUser.isVerified)
            throw httpErrors.badRequest("Email already registered");

        const otp = UtilService.generateOtp();
        const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000);

        if (!existingUser) {
            await UserService.createPendingUser({
                ...data,
                otp: { code: otp, expiresAt: otpExpiresAt, purpose: "emailVerification" },
                password,
                role: accountType,
                onboardingStep: "otp_sent",
            });
        } else {
            existingUser.password = password;
            existingUser.role = accountType;
            existingUser.otp = { code: otp, expiresAt: otpExpiresAt, purpose: "emailVerification" };
            existingUser.onboardingStep = "otp_sent";
            await (existingUser as any).save();
        }

        await UtilService.sendEmail(email, "Your OTP Code", `Your OTP is ${otp}`);
    }

    async verifyOtp({ email, otp }: IVerifyOtp): Promise<{ token: string; accountType: string }> {
        const valid = await UserService.verifyOtp(email, otp);
        if (!valid) throw httpErrors.badRequest("Invalid or expired OTP");

        const user = await UserService.getUserEmail(email);
        if (!user) throw httpErrors.notFound("User not found");

        const token = this.app.jwt.sign({
            id: (user as any)._id,
            role: user.role,
            email: user.email,
        });

        await UserService.updateUser((user as any)._id, {
            onboardingStep: "otp_verified",
            isVerified: true,
        });

        return { token, accountType: user.role };
    }

    async setPassword(userId: string, { password }: ISetPassword): Promise<void> {
        await UserService.setPassword(userId, password);
    }

    async login({ email, password }: ILogin): Promise<{ token: string; role: string }> {
        const user = await UserService.fetchOneUserWithPassword({ email });
        if (!user) throw httpErrors.badRequest("Invalid credentials");

        const match = await user.comparePassword(password);
        if (!match) throw httpErrors.badRequest("Invalid credentials");

        const token = this.app.jwt.sign({
            id: (user as any)._id,
            role: user.role,
            email: user.email,
        });

        return { token, role: user.role };
    }

    /* ---------------- HEDERA WALLET AUTH ---------------- */

    /** Step 1 — Create a random challenge (nonce) */
    async generateChallenge(accountId: string): Promise<{ nonce: string; }> {
        if (!accountId) throw httpErrors.badRequest("Missing accountId");

        const nonce = crypto.randomBytes(32).toString("hex");
        const key = `nonce:${accountId}`;

        // ioredis supports 'EX' seconds. We can also add 'NX' if you want to avoid overwriting.
        // If you prefer idempotency, omit 'NX' and just overwrite.
        // With NX: returns 'OK' on success or null if key already exists.
        const setRes = await this.app.redis.set(key, nonce, "EX", 300);
        if (setRes !== "OK") {
            // Extremely rare; handle defensively.
            await this.app.redis.del(key);
            await this.app.redis.set(key, nonce, "EX", 300);
        }
        return { nonce };
    }

    private async getAndDeleteNonce(key: string): Promise<string | null> {
        const client: any = this.app.redis as any;

        if (typeof client.getdel === "function") {
            return await client.getdel(key);
        }

        const val = await this.app.redis.get(key);
        if (val) await this.app.redis.del(key);
        return val;
    }


    /** Step 2 — Verify Hedera wallet signature */
    async verifySignature(
        publicKey: string,
        accountId: string,
        message: string,
        signature: string
    ): Promise<{ token: string }> {

        const key = `nonce:${accountId}`;

        // const stored = await this.getAndDeleteNonce(key);
        // if (!stored || stored !== message) {
        //     throw httpErrors.badRequest("Challenge expired or does not match");
        // }
        // console.log(publicKey, publicKey)
        // console.log(stored, "stored, message")
        // console.log(message, 'message')
        // console.log(signature, 'signature')

        const publicKeyBytes = Buffer.from(publicKey, "base64");
        const signatureBytes = Buffer.from(signature, "base64");
        // 2️⃣ Convert to Hedera PublicKey instance
        const pubKey = PublicKey.fromBytes(publicKeyBytes);
        const prefix = "\x19Hedera Signed Message:\n";
        const messageBytes = Buffer.from(message, "utf8");

        console.log("Backend message bytes:", Array.from(messageBytes).map(b => b.toString(16)));
        console.log("Backend signature bytes:", Array.from(signatureBytes).map(b => b.toString(16)));
        console.log("Backend publicKey bytes:", Array.from(publicKeyBytes).map(b => b.toString(16)));

        const valid = pubKey.verify(messageBytes, signatureBytes);
        console.log(valid, 'valid')
        return
        // const isValid = verifyHederaSignature(publicKey, signature, message);
        // console.log(isValid, 'isValid')
        // return
        // if (!isValid) throw httpErrors.unauthorized("Invalid Hedera signature");

        // Optional: store EVM address equivalent for tracking
        const evmAddress = this.accountIdToSolidityAddress(accountId);

        // Issue JWT token
        const investor = await investorService.connectWallet(accountId, {
            network: "hedera",
            evmAddress,
        });

        const token = this.app.jwt.sign({
            investorId: (investor as any)._id,
            role: "investor",
            accountId,

        });
        return { token };
    }


    /** Step 3 — Convert Hedera Account ID → Solidity Address */
    private accountIdToSolidityAddress(accountId: string): string {
        const parts = accountId.split(".");
        if (parts.length !== 3) throw httpErrors.badRequest("Invalid Hedera Account ID");

        const shard = BigInt(parts[0]);
        const realm = BigInt(parts[1]);
        const num = BigInt(parts[2]);

        return (
            "0x" +
            shard.toString(16).padStart(8, "0") +
            realm.toString(16).padStart(16, "0") +
            num.toString(16).padStart(16, "0")
        ).toLowerCase();
    }
}