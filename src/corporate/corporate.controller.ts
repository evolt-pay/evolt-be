import { FastifyRequest, FastifyReply } from "fastify";
import CorporateService from "./corporate.service.js";
import UtilService from "../util/util.service.js";

class CorporateController {
    async create(req: FastifyRequest, reply: FastifyReply) {
        try {
            const data = req.body as any;
            const corp = await CorporateService.createCorporate(data);
            reply.code(201).send(UtilService.customResponse(true, "Corporate created", corp));
        } catch (error: any) {
            reply.code(400).send(UtilService.customResponse(false, error.message));
        }
    }

    async list(_req: FastifyRequest, reply: FastifyReply) {
        const corporates = await CorporateService.getAllCorporates();
        reply.code(200).send(UtilService.customResponse(true, "Corporates fetched", corporates));
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
            const data = req.body as any;
            const corp = await CorporateService.updateCorporate(id, data);
            reply.code(200).send(UtilService.customResponse(true, "Corporate updated", corp));
        } catch (error: any) {
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