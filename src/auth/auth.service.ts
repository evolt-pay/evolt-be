import { FastifyInstance } from "fastify";
import { httpErrors } from "@fastify/sensible";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import investorService from "../investor/investor.service.js";


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
    async generateChallenge(accountId: string): Promise<{ nonce: string }> {
        if (!accountId) throw httpErrors.badRequest("Missing accountId");

        const nonce = crypto.randomBytes(32).toString("hex");

        await this.app.redis.setex(`nonce:${accountId}`, 300, nonce);

        return { nonce };
    }


    /** Step 2 — Verify Hedera wallet signature */
    async verifySignature(
        accountId: string,
        message: string,
        signature: string
    ): Promise<{ token: string }> {
        const nonce = await this.app.redis.get(`nonce:${accountId}`);

        if (!nonce || nonce !== message)
            throw httpErrors.badRequest("Challenge expired or does not match");

        // Burn nonce
        await this.app.redis.del(`nonce:${accountId}`);

        // Fetch public key from mirror node
        const response = await fetch(
            `https://testnet.mirrornode.hedera.com/api/v1/accounts/${accountId}`
        );
        if (!response.ok) throw httpErrors.badRequest("Failed to fetch Hedera account data");

        const accountData = await response.json();
        const rawKey =
            accountData.key?._key || accountData.key?.key || accountData.key;

        if (!rawKey) throw httpErrors.badRequest("Could not retrieve public key");

        // Add DER header for Hedera ED25519 format
        const publicKeyString = "302a300506032b6570032100" + rawKey;

        const signatureBytes = Buffer.from(signature, "base64");

        const isValid = verifyHederaSignature(message, signatureBytes, publicKeyString);
        if (!isValid) throw httpErrors.unauthorized("Invalid Hedera signature");

        // Optional: store EVM address equivalent for tracking
        const evmAddress = this.accountIdToSolidityAddress(accountId);

        // Issue JWT token
        const investor = await investorService.connectWallet(accountId, {
            network: "hedera",
            evmAddress,
        });

        const token = jwt.sign(
            {
                investorId: (investor as any)._id,
                accountId,
                evmAddress,
                role: "investor",
            },
            process.env.JWT_SECRET!,
            { expiresIn: "7d" }
        );

        console.log("✅ Verified Hedera signature successfully");
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