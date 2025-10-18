import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import AuthService from "./auth.service.js";
import UtilService from "../util/util.service.js";

import {
    ISendOtp,
    ISignup,
    IVerifyOtp,
    ISetPassword,
    ILogin,
} from "./auth.dto.js";

class AuthController {
    private readonly authService: AuthService;

    constructor(app: FastifyInstance) {
        this.authService = new AuthService(app);
    }

    sendOtp = async (req: FastifyRequest, reply: FastifyReply) => {
        const body = req.body as ISendOtp;
        await this.authService.sendOtp(body);
        reply.status(200).send(UtilService.customResponse(true, "OTP sent successfully"));
    };

    signup = async (req: FastifyRequest, reply: FastifyReply) => {
        const body = req.body as ISignup;
        await this.authService.signup(body);
        reply.status(200).send(UtilService.customResponse(true, "Signup OTP sent successfully"));
    };

    verifyOtp = async (req: FastifyRequest, reply: FastifyReply) => {
        const body = req.body as IVerifyOtp;
        const { token, accountType } = await this.authService.verifyOtp(body);
        reply.status(200).send(
            UtilService.customResponse(true, "OTP verified successfully", {
                token,
                accountType,
            })
        );
    };

    setPassword = async (req: FastifyRequest, reply: FastifyReply) => {
        const body = req.body as ISetPassword;
        const userId = (req.user as any).id;
        await this.authService.setPassword(userId, body);
        reply.status(201).send(UtilService.customResponse(true, "Password set successfully"));
    };

    login = async (req: FastifyRequest, reply: FastifyReply) => {
        const body = req.body as ILogin;
        const { token, role } = await this.authService.login(body);
        reply.status(200).send(UtilService.customResponse(true, "Login successful", { token, role }));
    };


    getChallenge = async (req: FastifyRequest, reply: FastifyReply) => {
        const { accountId } = req.query as any;
        if (!accountId)
            return reply.code(400).send(UtilService.customResponse(false, "Missing accountId"));

        const { nonce } = await this.authService.generateChallenge(accountId);
        reply.send(UtilService.customResponse(true, "Challenge generated", { nonce }));
    };

    verifySignature = async (req: FastifyRequest, reply: FastifyReply) => {
        const { publicKey, accountId, message, signature } = req.body as any;
        if (!accountId || !signature)
            return reply
                .code(400)
                .send(UtilService.customResponse(false, "Missing accountId or signature"));

        const { token } = await this.authService.verifySignature(publicKey, accountId, message, signature);
        reply.send(UtilService.customResponse(true, "Wallet verified", { token }));
    };





}

export default AuthController;