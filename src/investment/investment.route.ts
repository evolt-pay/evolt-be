import { FastifyInstance, RouteOptions } from "fastify";
import InvestmentController from "./investment.controller";
import { RouteMethods } from "../util/util.dto.js";
import {
    CreateInvestmentSchema,
    GetAllInvestmentsSchema,
    GetInvestmentsByInvestorSchema,
    SettleInvestmentsSchema,
} from "./investment.schema.js";
import { authenticate } from "../auth/auth.middleware.js";

export default async function investmentRoutes(app: FastifyInstance) {
    const routes: RouteOptions[] = [
        {
            method: RouteMethods.POST,
            url: "/",
            handler: (req, reply) => InvestmentController.invest(req, reply),
            preHandler: [authenticate],
            schema: CreateInvestmentSchema,
        },
        {
            method: RouteMethods.GET,
            url: "/",
            handler: (req, reply) => InvestmentController.getAll(req, reply),
            preHandler: [authenticate],
            schema: GetAllInvestmentsSchema,
        },
        {
            method: RouteMethods.GET,
            url: "/investor/:investorId",
            handler: (req, reply) => InvestmentController.getByInvestor(req, reply),
            preHandler: [authenticate],
            schema: GetInvestmentsByInvestorSchema,
        },
        {
            method: RouteMethods.POST,
            url: "/settle",
            handler: (req, reply) => InvestmentController.settle(req, reply),
            preHandler: [authenticate],
            schema: SettleInvestmentsSchema,
        },
    ];

    routes.forEach((r) => app.route(r));
}