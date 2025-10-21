import { FastifyRequest, FastifyReply } from "fastify";
import WithdrawService from "./withdraw.service.js";
import UtilService from "../util/util.service.js";

class WithdrawController {
    async withdraw(req: FastifyRequest, reply: FastifyReply) {
        try {
            const body = req.body as any;
            const data = await WithdrawService.withdraw(body);
            reply.code(200).send(UtilService.customResponse(true, "Withdrawal successful", data));
        } catch (e: any) {
            reply.code(400).send(UtilService.customResponse(false, e.message || "Withdrawal failed"));
        }
    }
}

export default new WithdrawController();