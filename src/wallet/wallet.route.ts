import { FastifyInstance, RouteOptions } from "fastify";
import { RouteMethods } from "../util/util.dto.js";
import { authenticateInvestor } from "../middleware/index.js";
import WalletController from "./wallet.controller.js";
import {
    CreateWalletSchema,
} from "./wallet.schema.js";

export default async function walletRoutes(app: FastifyInstance) {
    const routes: RouteOptions[] = [
        {
            method: RouteMethods.POST,
            url: "/create",
            // preHandler: [authenticateInvestor],
            handler: (req, reply) => WalletController.createWallet(req, reply),
            schema: CreateWalletSchema,
        },



    ];

    routes.forEach((r) => app.route(r));
}