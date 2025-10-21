import { FastifyInstance, RouteOptions } from "fastify";
import { RouteMethods } from "../util/util.dto.js";
import { authenticateInvestor } from "../middleware/index.js";
import WithdrawController from "./withdraw.controller.js";
import { WithdrawSchema } from "./withdraw.schema.js";

export default async function withdrawRoutes(app: FastifyInstance) {
    const routes: RouteOptions[] = [
        {
            method: RouteMethods.POST,
            url: "/",
            preHandler: [authenticateInvestor],
            handler: (req, reply) => WithdrawController.withdraw(req, reply),
            schema: WithdrawSchema,
        },
    ];

    routes.forEach((r) => app.route(r));
}