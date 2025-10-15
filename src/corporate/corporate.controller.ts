import { FastifyRequest, FastifyReply } from "fastify";
import CorporateService from "./corporate.service.js";
import { AzureUtil } from "../util/azure.util.js";
import UtilService from "../util/util.service.js";
import { v4 as uuidv4 } from "uuid";

class CorporateController {
    async create(req: FastifyRequest, reply: FastifyReply) {
        try {
            const body = req.body as any;

            const logoFile = body.logo;
            let logoUrl: string | null = null;
            if (logoFile && logoFile.toBuffer) {
                const buffer = await logoFile.toBuffer();
                logoUrl = await AzureUtil.uploadFileFromBuffer(buffer, `${uuidv4()}-${logoFile.filename}`, "corporate-logos"
                );
            }

            const data: Record<string, any> = {};
            for (const [key, val] of Object.entries(body)) {
                if (key !== "files") data[key] = (val as any).value ?? val;
            }

            if (logoUrl) data.logoUrl = logoUrl;
            const corp = await CorporateService.createCorporate(data);
            reply.code(201).send(UtilService.customResponse(true, "Corporate created", corp));
        } catch (error: any) {
            console.error("Corporate creation failed:", error);
            reply.code(400).send(UtilService.customResponse(false, error.message));
        }
    }

    async list(_req: FastifyRequest, reply: FastifyReply) {
        try {
            const corporates = await CorporateService.getAllCorporates();
            reply.code(200).send(UtilService.customResponse(true, "Corporates fetched", corporates));
        } catch (error: any) {
            reply.code(500).send(UtilService.customResponse(false, error.message));
        }
    }

    async get(req: FastifyRequest, reply: FastifyReply) {
        try {
            const { id } = req.params as any;
            const corp = await CorporateService.getCorporateById(id);
            reply.code(200).send(UtilService.customResponse(true, "Corporate fetched", corp));
        } catch (error: any) {
            reply.code(404).send(UtilService.customResponse(false, error.message));
        }
    }

    async update(req: FastifyRequest, reply: FastifyReply) {
        try {
            const { id } = req.params as any;
            const body = req.body as any;
            const logoFile = body.logo;

            let logoUrl: string | null = null;
            if (logoFile && logoFile.toBuffer) {
                const buffer = await logoFile.toBuffer();
                logoUrl = await AzureUtil.uploadFileFromBuffer(buffer, `corporates/${uuidv4()}-${logoFile.filename}`);
            }

            const data: Record<string, any> = {};
            for (const [key, val] of Object.entries(body)) {
                if (key !== "files") data[key] = (val as any).value ?? val;
            }

            if (logoUrl) data.logoUrl = logoUrl;

            const corp = await CorporateService.updateCorporate(id, data);
            reply.code(200).send(UtilService.customResponse(true, "Corporate updated", corp));
        } catch (error: any) {
            console.error("Corporate update failed:", error);
            reply.code(400).send(UtilService.customResponse(false, error.message));
        }
    }

    async delete(req: FastifyRequest, reply: FastifyReply) {
        try {
            const { id } = req.params as any;
            await CorporateService.deleteCorporate(id);
            reply.code(200).send(UtilService.customResponse(true, "Corporate deleted"));
        } catch (error: any) {
            reply.code(404).send(UtilService.customResponse(false, error.message));
        }
    }
}

export default new CorporateController();