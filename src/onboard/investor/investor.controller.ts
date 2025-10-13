import { FastifyRequest, FastifyReply } from "fastify";
import InvestorService from "./investor.service.js";
import UtilService from "../../util/util.service.js";

class InvestorController {
    async onboardInvestor(req: FastifyRequest, reply: FastifyReply) {
        try {
            const { user } = req as any;
            const body = req.body as any;

            const idDocument = body.idDocument;

            if (!idDocument || !idDocument.toBuffer) {
                return reply.code(400).send(UtilService.customResponse(false, "ID document file is required"));
            }

            const buffer = await idDocument.toBuffer();

            const formData: Record<string, any> = {};
            for (const [key, val] of Object.entries(body)) {
                if (key !== "idDocument") formData[key] = (val as any).value ?? val;
            }

            const investor = await InvestorService.onboardInvestor(
                user?.id,
                formData,
                {
                    buffer,
                    filename: idDocument.filename,
                    mimetype: idDocument.mimetype,
                }
            );

            return reply.code(201).send(
                UtilService.customResponse(true, "Investor onboarded successfully", investor)
            );
        } catch (error: any) {
            console.error("Investor onboarding error:", error);
            return reply
                .code(500)
                .send(UtilService.customResponse(false, error.message || "Internal Server Error"));
        }
    }
}

export default new InvestorController();