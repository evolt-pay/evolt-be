import { FastifyInstance, RouteOptions } from "fastify";
import CorporateController from "./corporate.controller.js";
import { CreateCorporateSchema, GetAllCorporatesSchema } from "./corporate.schema.js";
import { RouteMethods } from "../util/util.dto.js";
import { authenticate } from "../auth/auth.middleware.js";

export default async function corporateRoutes(app: FastifyInstance) {
    const routes: RouteOptions[] = [
        {
            method: RouteMethods.POST,
            url: "/",
            handler: (req, reply) => CorporateController.create(req, reply),
            schema: CreateCorporateSchema,
            preHandler: [authenticate],
        },
        {
            method: RouteMethods.GET,
            url: "/",
            handler: (req, reply) => CorporateController.list(req, reply),
            schema: GetAllCorporatesSchema,
            preHandler: [authenticate],
        },
        {
            method: RouteMethods.GET,
            url: "/:id",
            handler: (req, reply) => CorporateController.get(req, reply),
            preHandler: [authenticate],
        },
        {
            method: RouteMethods.PUT,
            url: "/:id",
            handler: (req, reply) => CorporateController.update(req, reply),
            preHandler: [authenticate],
        },
        {
            method: RouteMethods.DELETE,
            url: "/:id",
            handler: (req, reply) => CorporateController.delete(req, reply),
            preHandler: [authenticate],
        },
    ];

    routes.forEach((r) => app.route(r));
}