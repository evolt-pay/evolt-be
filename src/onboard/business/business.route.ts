import { FastifyInstance, RouteOptions } from "fastify";
import BusinessController from "./business.controller.js";
import { authenticate } from "../../middleware/index.js";
import { RouteMethods } from "../../util/util.dto.js";

export default function businessRoutes(app: FastifyInstance) {
    const routes: RouteOptions[] = [
        {
            method: RouteMethods.POST,
            url: "/business",
            preHandler: [authenticate],
            schema: {
                description: "Onboard business (KYB)",
                tags: ["Business"],
                consumes: ["multipart/form-data"],
            },
            handler: (req, reply) => BusinessController.createBusinessProfile(req, reply),
        },
        {
            method: RouteMethods.GET,
            url: "/business",
            preHandler: [authenticate],
            handler: (req, reply) => BusinessController.getBusinessProfile(req, reply),
        },
    ];

    routes.forEach((route) => app.route(route));
}