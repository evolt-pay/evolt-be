import { FastifyRequest, FastifyReply } from "fastify";
import BusinessService from "./business.service.js";
import UtilService from "../util/util.service.js";

class BusinessController {
    async createBusinessProfile(req: FastifyRequest, reply: FastifyReply) {
        try {
            const { user } = req as any;
            const body = req.body as any;

            const ownershipDoc = body.ownershipDocument;
            if (!ownershipDoc || !ownershipDoc.toBuffer) {
                return reply.status(400).send(
                    UtilService.customResponse(false, "Ownership/shareholding document is required")
                );
            }

            const ownershipBuffer = await ownershipDoc.toBuffer();

            const formData: Record<string, any> = {};
            for (const [key, val] of Object.entries(body)) {
                if (!key.startsWith("signatories") && key !== "ownershipDocument") {
                    formData[key] = (val as any).value ?? val;
                }
            }

            const signatoriesMap: Record<number, any> = {};
            for (const [key, val] of Object.entries(body)) {
                const match = key.match(/^signatories\[(\d+)\]\.(.+)$/);
                if (!match) continue;

                const index = parseInt(match[1]);
                const field = match[2];
                if (!signatoriesMap[index]) signatoriesMap[index] = {};

                if (field === "idDocument" && val && (val as any).toBuffer) {
                    const buffer = await (val as any).toBuffer();
                    const idUrl = await BusinessService.uploadToAzure(
                        buffer,
                        `signatories/${user._id}-${Date.now()}-${(val as any).filename}`,
                        (val as any).mimetype
                    );
                    signatoriesMap[index].idUrl = idUrl;
                } else {
                    signatoriesMap[index][field] = (val as any).value ?? val;
                }
            }

            const signatories = Object.values(signatoriesMap);

            const profile = await BusinessService.createBusinessProfile(
                user?.id,
                {
                    ...formData,
                    signatories,
                },
                {
                    buffer: ownershipBuffer,
                    filename: ownershipDoc.filename,
                    mimetype: ownershipDoc.mimetype,
                }
            );

            reply.status(201).send(
                UtilService.customResponse(true, "Business KYB profile created successfully", profile)
            );
        } catch (error: any) {
            console.error("Business onboarding error:", error);
            reply
                .status(500)
                .send(UtilService.customResponse(false, error.message || "Internal Server Error"));
        }
    }

    async getBusinessProfile(req: FastifyRequest, reply: FastifyReply) {
        try {
            const { user } = req as any;
            const profile = await BusinessService.getBusinessProfile(user?._id);

            if (!profile) {
                return reply
                    .status(404)
                    .send(UtilService.customResponse(false, "Business profile not found"));
            }

            reply
                .status(200)
                .send(UtilService.customResponse(true, "Business profile fetched", profile));
        } catch (error: any) {
            reply
                .status(500)
                .send(UtilService.customResponse(false, error.message || "Internal Server Error"));
        }
    }
}

export default new BusinessController();