import { FastifyReply, FastifyRequest } from 'fastify';
import UserModel from '../user/user.model';
import { httpErrors } from '@fastify/sensible';

export async function authenticate(req: FastifyRequest, reply: FastifyReply) {
    try {
        await req.jwtVerify();
        const payload = req.user as any;
        const user = await UserModel.findById(payload.id);
        if (!user) throw httpErrors.unauthorized('User not found');

        if (user.passwordUpdatedAt && payload.passwordUpdatedAt < user.passwordUpdatedAt.getTime()) {
            throw httpErrors.unauthorized('Token invalid after password change');
        }


        req.user = { id: user.id, role: user.role };
    } catch (err) {
        reply.send(err);
    }
}