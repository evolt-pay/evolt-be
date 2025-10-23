import { FastifyReply, FastifyRequest } from "fastify";
import UtilService from "../util/util.service.js";
import { WalletService } from "./wallet.service.js";

class WalletController {
    // ── Wallet basics ──────────────────────────────────────────────────────────
    async createWallet(req: FastifyRequest, reply: FastifyReply) {
        try {
            const { userId } = req.body as any;
            const data = await WalletService.createWallet(userId);
            reply.code(200).send(UtilService.customResponse(true, "Wallet created", data));
        } catch (e: any) {
            reply.code(400).send(UtilService.customResponse(false, e.message || "Create wallet failed"));
        }
    }




}

export default new WalletController();