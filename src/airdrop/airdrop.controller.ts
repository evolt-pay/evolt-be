import { FastifyRequest, FastifyReply } from "fastify";
import AirdropService from "./airdrop.service.js";
import UtilService from "../util/util.service.js";

export default class AirdropController {
    static async airdrop(req: FastifyRequest, reply: FastifyReply) {
        try {
            if (process.env.NODE_ENV === "production") {
                return reply.code(403).send(UtilService.customResponse(false, "Airdrop disabled in production"));
            }

            // const adminToken = req.headers["x-sandbox-token"] as string | undefined;
            // if (!adminToken || adminToken !== process.env.SANDBOX_ADMIN_TOKEN) {
            //     return reply.code(401).send(UtilService.customResponse(false, "Unauthorized"));
            // }

            const { recipients, defaultAmount } = (req.body || {}) as {
                recipients: { accountId: string; amount?: number }[];
                defaultAmount?: number;
            };

            const data = await AirdropService.airdropVusd({ recipients, defaultAmount });
            return reply.send(UtilService.customResponse(true, "Airdrop complete", data));
        } catch (e: any) {
            return reply.code(400).send(UtilService.customResponse(false, e?.message || "Airdrop failed"));
        }
    }
}