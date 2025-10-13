import { FastifyInstance, RouteOptions } from "fastify";
import InvestorController from "./investor.controller.js";
import { authenticate } from "../../middleware/index.js";
import { RouteMethods } from "../../util/util.dto.js";

export default async function investorRoutes(app: FastifyInstance) {
    const routes: RouteOptions[] = [
        {
            method: RouteMethods.POST,
            url: "/investor",
            preHandler: [authenticate],
            handler: (req, reply) => InvestorController.onboardInvestor(req, reply),
            schema: {
                description: "Onboard investor (KYC info + ID upload)",
                tags: ["Investor"],
                consumes: ["multipart/form-data"],
            },
        },
    ];

    routes.forEach((r) => app.route(r));
}