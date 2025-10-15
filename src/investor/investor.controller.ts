import { FastifyRequest, FastifyReply } from "fastify";
import InvestorService from "./investor.service.js";
import UtilService from "../util/util.service.js";

class InvestorController {
    /** ✅ Connect wallet (creates investor if new) */
    async connectWallet(req: FastifyRequest, reply: FastifyReply) {
        try {
            const { walletAddress } = req.body as { walletAddress: string };
            if (!walletAddress) {
                return reply.code(400).send(UtilService.customResponse(false, "Wallet address is required"));
            }

            const investor = await InvestorService.connectWallet(walletAddress);
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

    /** ✅ Fetch investments for connected wallet */
    async getInvestorInvestments(req: FastifyRequest, reply: FastifyReply) {
        try {
            const { walletAddress } = req.params as any;

            const result = await InvestorService.getInvestorInvestments(walletAddress);

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
}

export default new InvestorController();