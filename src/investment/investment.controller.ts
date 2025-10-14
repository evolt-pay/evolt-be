import { FastifyRequest, FastifyReply } from "fastify";
import InvestmentService from "./investment.service.js";

class InvestmentController {
    async invest(req: FastifyRequest, reply: FastifyReply) {
        try {
            const { ...data } = req.body as any;
            const { user } = req as any;
            const result = await InvestmentService.invest(user.id, data);
            return reply.code(201).send({
                message: "Investment successful",
                data: result.investment,
            });
        } catch (error: any) {
            console.log("Investment error:", error);
            return reply.code(500).send({ message: error.message || "Internal server error" });
        }
    }

    async getAll(_req: FastifyRequest, reply: FastifyReply) {
        const data = await InvestmentService.getAllInvestments();
        reply.code(200).send({ message: "All investments", data });
    }

    async getByInvestor(req: FastifyRequest, reply: FastifyReply) {
        const { investorId } = req.params as any;
        const data = await InvestmentService.getInvestmentsByInvestor(investorId);
        reply.code(200).send({ message: "Investor investments", data });
    }

    async settle(_req: FastifyRequest, reply: FastifyReply) {
        const result = await InvestmentService.settleMaturedInvestments();
        reply.code(200).send({ message: "Matured investments settled", data: result });
    }



}

export default new InvestmentController();