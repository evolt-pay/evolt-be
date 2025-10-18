import { FastifyInstance, RouteOptions } from "fastify";
import UserController from "./user.controller.js";
import { authenticateUser } from "../middleware/index.js";
import {
    GetProfileSchema,
    UpdateProfileSchema,
} from "./user.schema.js";
import { RouteMethods } from "../util/util.dto.js";

export default function userRoutes(app: FastifyInstance) {
    const controller = new UserController(app);

    const routes: RouteOptions[] = [
        { method: RouteMethods.GET, url: "/profile", handler: controller.getProfile, preHandler: [authenticateUser], schema: GetProfileSchema },
        { method: RouteMethods.PUT, url: "/profile", handler: controller.updateProfile, preHandler: [authenticateUser], schema: UpdateProfileSchema },
    ];

    routes.forEach((route) => app.route(route));
}