import { FastifyRequest, FastifyReply } from "fastify";
import AssetService from "./asset.service.js";
import TokenizationService from "../tokenization/tokenization.service.js";

class AssetController {
    async createAsset(req: FastifyRequest, reply: FastifyReply) {
        try {
            const { user } = req as any;
            const body = req.body as any;
            const file = body.files;

            if (!file || !file.toBuffer) {
                return reply.status(400).send({ message: "Asset document (PDF or image) is required" });
            }

            const buffer = await file.toBuffer();

            const asset = await AssetService.createAsset(user.id, body, {
                buffer,
            });

            return reply.code(201).send({
                success: true,
                message: "Asset created successfully",
                data: asset,
            });
        } catch (error: any) {
            console.error("Create asset error:", error);
            return reply.code(500).send({ success: false, message: error.message || "Internal Server Error" });
        }
    }

    async verifyAsset(req: FastifyRequest, reply: FastifyReply) {
        try {
            const { id, verifier } = req.body as any;
            const asset = await AssetService.verifyAsset(id, verifier);
            console.log('asset', asset)
            const tokenized = await TokenizationService.tokenizeAsset(asset);

            return reply.code(200).send({
                success: true,
                message: "Asset verified and tokenized successfully",
                data: tokenized,
            });
        } catch (error: any) {
            console.error("Verify asset error:", error);
            return reply.code(400).send({ success: false, message: error.message });
        }
    }

    async getAsset(req: FastifyRequest, reply: FastifyReply) {
        try {
            const { id } = req.params as any;
            const asset = await AssetService.getAssetById(id);

            if (!asset) {
                return reply.code(404).send({ success: false, message: "Asset not found" });
            }

            return reply.code(200).send({ success: true, data: asset });
        } catch (error: any) {
            console.error("Get asset error:", error);
            return reply.code(500).send({ success: false, message: error.message });
        }
    }

    async getAssetsByType(req: FastifyRequest, reply: FastifyReply) {
        try {
            const { type } = req.params as any;
            const assets = await AssetService.getAssetsByType(type);

            return reply.code(200).send({
                success: true,
                message: `Assets of type '${type}' fetched successfully`,
                data: assets,
            });
        } catch (error: any) {
            console.error("Get assets by type error:", error);
            return reply.code(500).send({ success: false, message: error.message });
        }
    }



    async getVerifiedAssets(_req: FastifyRequest, reply: FastifyReply) {
        try {
            const assets = await AssetService.getVerifiedAssets();
            console.log(assets[0])
            return reply.code(200).send({
                success: true,
                message: "Verified assets ready for investment",
                data: assets,
            });
        } catch (error: any) {
            console.error("Fetch verified assets error:", error);
            return reply.code(500).send({ success: false, message: error.message });
        }
    }
}

export default new AssetController();