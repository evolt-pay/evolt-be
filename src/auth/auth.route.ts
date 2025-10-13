import { FastifyInstance, RouteOptions } from "fastify";
import AuthController from "./auth.controller.js";
import {
    SendOtpSchema,
    SendSignupOtpSchema,
    VerifyOtpSchema,
    SetPasswordSchema,
    LoginSchema,
} from "./auth.schema.js";
import { RouteMethods } from "../util/util.dto.js";
import { authenticate } from "../middleware/index.js";

export default function authRoutes(app: FastifyInstance) {
    const controller = new AuthController(app);

    const routes: RouteOptions[] = [
        { method: RouteMethods.POST, url: "/auth/send-otp", handler: controller.sendOtp, schema: SendOtpSchema },
        { method: RouteMethods.POST, url: "/auth/send-signup-otp", handler: controller.sendSignupOtp, schema: SendSignupOtpSchema },
        { method: RouteMethods.POST, url: "/auth/verify-otp", handler: controller.verifyOtp, schema: VerifyOtpSchema },
        { method: RouteMethods.POST, url: "/auth/set-password", handler: controller.setPassword, preHandler: [authenticate], schema: SetPasswordSchema },
        { method: RouteMethods.POST, url: "/auth/login", handler: controller.login, schema: LoginSchema },
    ];

    routes.forEach((route) => app.route(route));
}