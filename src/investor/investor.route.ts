import { FastifyInstance } from "fastify";
import InvestorController from "./investor.controller.js";
import { RouteMethods } from "../util/util.dto.js";

export default async function investorRoutes(app: FastifyInstance) {


    app.route({
        method: RouteMethods.GET,
        url: "/investments/:walletAddress",
        schema: {
            description: "Get all investments for wallet",
            tags: ["Investor"],
        },
        handler: (req, reply) => InvestorController.getInvestorInvestments(req, reply),
    });
}