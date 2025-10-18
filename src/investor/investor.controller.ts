import { FastifyRequest, FastifyReply } from "fastify";
import InvestorService from "./investor.service.js";
import UtilService from "../util/util.service.js";

class InvestorController {
    /** (creates investor if new) */
    async addInvestor(req: FastifyRequest, reply: FastifyReply) {
        try {
            const { accountId } = req.body as { accountId: string };
            if (!accountId) {
                return reply.code(400).send(UtilService.customResponse(false, "Wallet address is required"));
            }

            const investor = await InvestorService.addInvestor(accountId);
            return reply
                .code(200)
                .send(UtilService.customResponse(true, "Wallet connected successfully", investor));
        } catch (error: any) {
            console.error("Connect wallet error:", error);
            return reply
                .code(500)
                .send(UtilService.customResponse(false, error.message || "Internal Server Error"));
        }
    }

    async getInvestorInvestments(req: FastifyRequest, reply: FastifyReply) {
        try {
            const { user } = req as any;

            const result = await InvestorService.getInvestorInvestments(user.accountId);
            return reply
                .code(200)
                .send(UtilService.customResponse(true, "Investor investments fetched", result));
        } catch (error: any) {
            console.error("Get investor investments error:", error);
            return reply
                .code(500)
                .send(UtilService.customResponse(false, error.message || "Internal Server Error"));
        }
    }

    async getInvestorPortfolio(req: FastifyRequest, reply: FastifyReply) {
        try {
            const { user } = req as any;
            const data = await InvestorService.getInvestorPortfolio(user.accountId);
            return reply
                .code(200)
                .send(UtilService.customResponse(true, "Investor portfolio fetched", data));
        } catch (error: any) {
            console.error("Get investor portfolio error:", error);
            return reply
                .code(500)
                .send(UtilService.customResponse(false, error.message || "Internal Server Error"));
        }
    }
}

export default new InvestorController();