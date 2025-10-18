import { FastifyInstance, RouteOptions } from "fastify";
import { RouteMethods } from "../util/util.dto.js";
import { authenticateInvestor } from "../middleware/index.js";
import SwapController from "./swap.controller.js";
import { PrepareSwapSchema, SettleSwapSchema } from "./swap.schema.js";

export default async function swapRoutes(app: FastifyInstance) {
    const routes: RouteOptions[] = [
        {
            method: RouteMethods.POST,
            url: "/prepare",
            preHandler: [authenticateInvestor],
            handler: (req, reply) => SwapController.prepare(req, reply),
            schema: PrepareSwapSchema,
        },
        {
            method: RouteMethods.POST,
            url: "/settle",
            preHandler: [authenticateInvestor],
            handler: (req, reply) => SwapController.settle(req, reply),
            schema: SettleSwapSchema,
        },
    ];

    routes.forEach((r) => app.route(r));
}