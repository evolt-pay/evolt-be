import { FastifyRequest, FastifyReply } from "fastify";
import PoolService from "./pool.service.js";
import UtilService from "../util/util.service.js";

class PoolController {
    async list(req: FastifyRequest, reply: FastifyReply) {
        try {
            const { page, limit, status, search } = (req.query || {}) as any;
            const data = await PoolService.listPools({
                page: Number(page) || 1,
                limit: Number(limit) || 20,
                status: status || "all",
                search,
            });
            reply.code(200).send(UtilService.customResponse(true, "Pools fetched", data));
        } catch (error: any) {
            console.error("Pool list error:", error);
            reply
                .code(500)
                .send(UtilService.customResponse(false, error.message || "Internal Server Error"));
        }
    }

    async details(req: FastifyRequest, reply: FastifyReply) {
        try {
            const { invoiceId } = req.params as any;
            const data = await PoolService.getPoolDetails(invoiceId);
            reply.code(200).send(UtilService.customResponse(true, "Pool details fetched", data));
        } catch (error: any) {
            console.error("Pool details error:", error);
            reply
                .code(500)
                .send(UtilService.customResponse(false, error.message || "Internal Server Error"));
        }
    }
}

export default new PoolController();