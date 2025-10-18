import { FastifyInstance, RouteOptions } from "fastify";
import CorporateController from "./corporate.controller.js";
import { CreateCorporateSchema, GetCorporateByIdSchema, UpdateCorporateSchema, DeleteCorporateSchema } from "./corporate.schema.js";
import { RouteMethods } from "../util/util.dto.js";
import { authenticateUser } from "../middleware/index.js";

export default async function corporateRoutes(app: FastifyInstance) {
    const routes: RouteOptions[] = [
        {
            method: RouteMethods.POST,
            url: "/",
            handler: (req, reply) => CorporateController.create(req, reply),
            schema: CreateCorporateSchema,
            // preHandler: [authenticate],
        },
        {
            method: RouteMethods.GET,
            url: "/:id",
            handler: (req, reply) => CorporateController.get(req, reply),
            schema: GetCorporateByIdSchema,
            preHandler: [authenticateUser],
        },
        {
            method: RouteMethods.PUT,
            url: "/:id",
            handler: (req, reply) => CorporateController.update(req, reply),
            schema: UpdateCorporateSchema,
            preHandler: [authenticateUser],
        },
        {
            method: RouteMethods.DELETE,
            url: "/:id",
            handler: (req, reply) => CorporateController.delete(req, reply),
            schema: DeleteCorporateSchema,
            preHandler: [authenticateUser],
        },
    ];

    routes.forEach((r) => app.route(r));
}