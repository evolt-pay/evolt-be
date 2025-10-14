import { FastifyInstance, RouteOptions } from "fastify";
import PoolController from "./pool.controller.js";
import { GetAllPoolsSchema, GetPoolDetailsSchema } from "./pool.schema.js";
import { RouteMethods } from "../util/util.dto.js";

export default async function poolRoutes(app: FastifyInstance) {
    const routes: RouteOptions[] = [
        {
            method: RouteMethods.GET,
            url: "/pools",
            handler: (req, reply) => PoolController.list(req, reply),
            schema: GetAllPoolsSchema,
        },
        {
            method: RouteMethods.GET,
            url: "/pools/:invoiceId",
            handler: (req, reply) => PoolController.details(req, reply),
            schema: GetPoolDetailsSchema,
        },
    ];

    routes.forEach((r) => app.route(r));
}