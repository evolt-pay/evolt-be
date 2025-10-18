import { FastifyInstance, RouteOptions } from "fastify";
import BusinessController from "./business.controller.js";
import { authenticateUser } from "../middleware/index.js";
import { RouteMethods } from "../util/util.dto.js";
import { GetBusinessSchema, OnboardBusinessSchema } from "./business.schema.js";

export default function businessRoutes(app: FastifyInstance) {
    const routes: RouteOptions[] = [
        {
            method: RouteMethods.POST,
            url: "/",
            preHandler: [authenticateUser],
            schema: OnboardBusinessSchema,
            handler: (req, reply) => BusinessController.createBusinessProfile(req, reply),
        },
        {
            method: RouteMethods.GET,
            url: "/",
            preHandler: [authenticateUser],
            schema: GetBusinessSchema,
            handler: (req, reply) => BusinessController.getBusiness(req, reply),
        },
    ];

    routes.forEach((route) => app.route(route));
}