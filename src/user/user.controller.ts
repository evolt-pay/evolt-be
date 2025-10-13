import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import UserService from "./user.service.js";
import UtilService from "../util/util.service.js";
import { IUser } from "./user.model.js";

class UserController {
    constructor(private app: FastifyInstance) { }

    /**
     * Fetch current authenticated user's profile
     */
    getProfile = async (req: FastifyRequest, reply: FastifyReply) => {
        const userId = (req.user as any).id;
        const user = await UserService.getUserById(userId);

        if (!user) {
            return reply
                .status(404)
                .send(UtilService.customResponse(false, "User not found"));
        }

        reply
            .status(200)
            .send(UtilService.customResponse(true, "User profile fetched", user));
    };

    /**
     * Update profile info for the authenticated user
     */
    updateProfile = async (req: FastifyRequest, reply: FastifyReply) => {
        const userId = (req.user as any).id;
        const data = req.body as Partial<IUser>;

        const updated = await UserService.updateUser(userId, data);

        reply
            .status(200)
            .send(UtilService.customResponse(true, "User profile updated", updated));
    }
}

export default UserController;