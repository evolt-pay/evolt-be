import { FastifyInstance, RouteOptions } from "fastify";
import AssetController from "./asset.controller.js";
import { authenticateUser } from "../middleware/index.js";
import {
    CreateAssetSchema,
    VerifyAssetSchema,
    GetAssetSchema,
    GetAssetsByTypeSchema,
    GetVerifiedAssetsSchema,
} from "./asset.schema.js";
import { RouteMethods } from "../util/util.dto.js";

export default async function assetRoutes(app: FastifyInstance) {
    const routes: RouteOptions[] = [
        {
            method: RouteMethods.POST,
            url: "/",
            preHandler: [authenticateUser],
            handler: (req, reply) => AssetController.createAsset(req, reply),
            schema: CreateAssetSchema,
        },
        {
            method: RouteMethods.POST,
            url: "/verify",
            handler: (req, reply) => AssetController.verifyAsset(req, reply),
            schema: VerifyAssetSchema,
        },
        {
            method: RouteMethods.GET,
            url: "/:id",
            preHandler: [authenticateUser],
            handler: (req, reply) => AssetController.getAsset(req, reply),
            schema: GetAssetSchema,
        },
        {
            method: RouteMethods.GET,
            url: "/verified",
            handler: (req, reply) => AssetController.getVerifiedAssets(req, reply),
            schema: GetVerifiedAssetsSchema,
        },
        {
            method: RouteMethods.GET,
            url: "/type/:type",
            handler: (req, reply) => AssetController.getAssetsByType(req, reply),
            schema: GetAssetsByTypeSchema,

        },
    ];

    routes.forEach((r) => app.route(r));
}