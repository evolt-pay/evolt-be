import { FastifyInstance, RouteOptions } from "fastify";
import InvestorController from "./investor.controller.js";
import { authenticateInvestor } from "../middleware/index.js";
import {
    GetInvestorPortfolioSchema,
} from "./investor.schema.js";
import { RouteMethods } from "../util/util.dto.js";

export default async function investorRoutes(app: FastifyInstance) {
    const routes: RouteOptions[] = [

        {
            method: RouteMethods.GET,
            url: "/portfolio",
            preHandler: [authenticateInvestor],
            handler: (req, reply) => InvestorController.getInvestorPortfolio(req, reply),
            schema: GetInvestorPortfolioSchema,
        },
    ];

    routes.forEach((r) => app.route(r));
}