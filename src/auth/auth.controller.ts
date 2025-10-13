import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import AuthService from "./auth.service.js";
import UtilService from "../util/util.service.js";
import {
    ISendOtp,
    ISendSignupOtp,
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

    sendSignupOtp = async (req: FastifyRequest, reply: FastifyReply) => {
        const body = req.body as ISendSignupOtp;
        await this.authService.sendSignupOtp(body);
        reply.status(200).send(UtilService.customResponse(true, "Signup OTP sent successfully"));
    };

    verifyOtp = async (req: FastifyRequest, reply: FastifyReply) => {
        const body = req.body as IVerifyOtp;
        const { token } = await this.authService.verifyOtp(body);
        reply
            .status(200)
            .send(UtilService.customResponse(true, "OTP verified successfully", { token }));
    };

    setPassword = async (req: FastifyRequest, reply: FastifyReply) => {
        const body = req.body as ISetPassword;
        const userId = (req.user as any).id;
        await this.authService.setPassword(userId, body);
        reply.status(201).send(UtilService.customResponse(true, "Password set successfully"));
    };

    login = async (req: FastifyRequest, reply: FastifyReply) => {
        const body = req.body as ILogin;
        const { token } = await this.authService.login(body);
        reply.status(200).send(UtilService.customResponse(true, "Login successful", { token }));
    };
}

export default AuthController;