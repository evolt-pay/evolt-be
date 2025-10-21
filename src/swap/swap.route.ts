import { FastifyInstance, RouteOptions } from "fastify";
import { RouteMethods } from "../util/util.dto.js";
import { authenticateInvestor } from "../middleware/index.js";
import SwapController from "./swap.controller.js";
import {
    PrepareDepositSchema,
    SettleDepositSchema,
    PrepareWithdrawSchema,
    SettleWithdrawSchema,
} from "./swap.schema.js";

export default async function swapRoutes(app: FastifyInstance) {
    const routes: RouteOptions[] = [
        {
            method: RouteMethods.POST,
            url: "/deposit/prepare",
            preHandler: [authenticateInvestor],
            handler: (req, reply) => SwapController.prepareDeposit(req, reply),
            schema: PrepareDepositSchema,
        },
        {
            method: RouteMethods.POST,
            url: "/deposit/settle",
            preHandler: [authenticateInvestor],
            handler: (req, reply) => SwapController.settleDeposit(req, reply),
            schema: SettleDepositSchema,
        },

        {
            method: RouteMethods.POST,
            url: "/withdraw/prepare",
            preHandler: [authenticateInvestor],
            handler: (req, reply) => SwapController.prepareWithdraw(req, reply),
            schema: PrepareWithdrawSchema,
        },
        {
            method: RouteMethods.POST,
            url: "/withdraw/settle",
            preHandler: [authenticateInvestor],
            handler: (req, reply) => SwapController.settleWithdraw(req, reply),
            schema: SettleWithdrawSchema,
        },
    ];

    routes.forEach((r) => app.route(r));
}