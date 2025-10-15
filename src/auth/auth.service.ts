import { FastifyInstance } from "fastify";
import { httpErrors } from "@fastify/sensible";
import { ethers } from "ethers";
import UserService from "../user/user.service.js";
import UtilService from "../util/util.service.js";
import {
    ISendOtp,
    ISignup,
    IVerifyOtp,
    ISetPassword,
    ILogin,
} from "./auth.dto.js";
import investorService from "../investor/investor.service.js";

export default class AuthService {
    private nonceStore = new Map<string, string>();

    constructor(private app: FastifyInstance) { }


    async sendOtp({ email }: ISendOtp): Promise<void> {
        const user = await UserService.fetchOneUser({ email });

        if (user && user.isVerified) {
            throw httpErrors.badRequest("Email is already registered");
        }

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

        if (existingUser && existingUser.isVerified) {
            throw httpErrors.badRequest("Email already registered");
        }

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


    /* -------------------- INVESTOR WALLET AUTH FLOW -------------------- */

    generateNonce(walletAddress: string): string {
        const nonce = Math.floor(Math.random() * 1e6).toString(36);
        this.nonceStore.set(walletAddress.toLowerCase(), nonce);
        return nonce;
    }

    async verifyInvestorWallet(walletAddress: string, signature: string): Promise<{ token: string }> {
        const nonce = this.nonceStore.get(walletAddress.toLowerCase());
        if (!nonce) throw new Error("Nonce not found or expired");

        const message = `Sign this message to verify your wallet as an Investor on Volt.\nNonce: ${nonce}`;
        const recovered = ethers.verifyMessage(message, signature);

        if (recovered.toLowerCase() !== walletAddress.toLowerCase()) {
            throw new Error("Invalid signature");
        }

        this.nonceStore.delete(walletAddress.toLowerCase());

        const investor = await investorService.connectWallet(walletAddress);

        const token = this.app.jwt.sign(
            {
                investorId: (investor as any)._id,
                walletAddress,
                role: "investor",
            },
            { expiresIn: "2h" }
        );

        return { token };
    }
}