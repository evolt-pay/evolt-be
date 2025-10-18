
import { FastifyInstance, RouteOptions } from "fastify";
import AirdropController from "./airdrop.controller.js";
import { RouteMethods } from "../util/util.dto.js";
import { AirdropSchema } from "./airdrop.schema.js";

export default async function airdropRoutes(app: FastifyInstance) {
    const routes: RouteOptions[] = [
        {
            method: RouteMethods.POST,
            url: "/airdrop",
            handler: (req, reply) => AirdropController.airdrop(req, reply),
            schema: AirdropSchema,
        }
    ];

    routes.forEach((r) => app.route(r));
}