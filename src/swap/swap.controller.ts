import { FastifyRequest, FastifyReply } from "fastify";
import SwapService from "./swap.service.js";
import UtilService from "../util/util.service.js";

class SwapController {
    async prepare(req: FastifyRequest, reply: FastifyReply) {
        try {
            const body = req.body as any;
            const data = await SwapService.prepareSwap(body);
            reply.code(200).send(UtilService.customResponse(true, "Swap prepared", data));
        } catch (e: any) {
            reply.code(400).send(UtilService.customResponse(false, e.message || "Prepare failed"));
        }
    }

    async settle(req: FastifyRequest, reply: FastifyReply) {
        try {
            const body = req.body as any;
            const data = await SwapService.settleSwap(body);
            reply.code(200).send(UtilService.customResponse(true, "Swap settled", data));
        } catch (e: any) {
            reply.code(400).send(UtilService.customResponse(false, e.message || "Settle failed"));
        }
    }
}

export default new SwapController();