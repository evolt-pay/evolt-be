import { FastifyRequest, FastifyReply } from "fastify";
import SwapService from "./swap.service.js";
import UtilService from "../util/util.service.js";

class SwapController {
    async prepareDeposit(req: FastifyRequest, reply: FastifyReply) {
        try {
            const body = req.body as any;
            const data = await SwapService.prepareDeposit(body);
            reply.code(200).send(UtilService.customResponse(true, "Deposit prepared", data));
        } catch (e: any) {
            reply.code(400).send(UtilService.customResponse(false, e.message || "Prepare failed"));
        }
    }

    async settleDeposit(req: FastifyRequest, reply: FastifyReply) {
        try {
            const body = req.body as any;
            const data = await SwapService.settleDeposit(body);
            reply.code(200).send(UtilService.customResponse(true, "Deposit settled", data));
        } catch (e: any) {
            reply.code(400).send(UtilService.customResponse(false, e.message || "Settle failed"));
        }
    }

    async prepareWithdraw(req: FastifyRequest, reply: FastifyReply) {
        try {
            const body = req.body as any;
            const data = await SwapService.prepareWithdraw(body);
            reply.code(200).send(UtilService.customResponse(true, "Withdraw prepared", data));
        } catch (e: any) {
            reply.code(400).send(UtilService.customResponse(false, e.message || "Prepare failed"));
        }
    }

    async settleWithdraw(req: FastifyRequest, reply: FastifyReply) {
        try {
            const body = req.body as any;
            const data = await SwapService.settleWithdraw(body);
            reply.code(200).send(UtilService.customResponse(true, "Withdraw settled", data));
        } catch (e: any) {
            reply.code(400).send(UtilService.customResponse(false, e.message || "Settle failed"));
        }
    }
}

export default new SwapController();