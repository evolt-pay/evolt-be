import { FastifyReply, FastifyRequest } from "fastify";
import { httpErrors } from "@fastify/sensible";
import { UserModel } from "../user/user.model.js";
import { InvestorModel } from "../investor/investor.model.js";

type JwtBase = { iat?: number };
type JwtUserPayload = JwtBase & { id: string; role?: string };
type JwtInvestorPayload = JwtBase & { role?: "investor"; accountId?: string; investorId?: string };

export async function authenticateUser(req: FastifyRequest, reply: FastifyReply) {
    try {
        await req.jwtVerify();
        const payload = req.user as JwtUserPayload;

        if (!payload?.id) throw httpErrors.unauthorized("Invalid token payload");

        const user = await UserModel.findById(payload.id);
        if (!user) throw httpErrors.unauthorized("User not found");

        if (user.passwordUpdatedAt && payload.iat) {
            const tokenIssuedAtMs = payload.iat * 1000;
            if (tokenIssuedAtMs < user.passwordUpdatedAt.getTime()) {
                throw httpErrors.unauthorized("Token invalid after password change");
            }
        }

        (req as any).user = { id: String(user._id), role: user.role ?? "user" };
    } catch (err) {
        return reply.send(err);
    }
}


export async function authenticateInvestor(req: FastifyRequest, reply: FastifyReply) {
    try {
        await req.jwtVerify();
        const payload = req.user as JwtInvestorPayload;
        if (payload.role !== "investor") {
            throw httpErrors.unauthorized("Investor token required");
        }

        let investor = null;

        if (payload.investorId) {
            investor = await InvestorModel.findById(payload.investorId);
        } else if (payload.accountId) {
            investor = await InvestorModel.findOne({ accountId: payload.accountId });
        }

        if (!investor) throw httpErrors.unauthorized("Investor not found");



        (req as any).user = {
            id: String(investor._id),
            role: "investor",
            accountId: investor.accountId,
        };
    } catch (err) {
        return reply.send(err);
    }
}

