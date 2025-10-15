import { FastifyReply, FastifyRequest } from 'fastify';

export async function authenticate(
    request: FastifyRequest,
    reply: FastifyReply
) {
    try {
        await request.jwtVerify();
    } catch (err) {
        reply.code(401).send({ success: false, error: 'Unauthorized' });
    }
}

export async function validatePasswordsMatch(req: FastifyRequest, reply: FastifyReply) {
    const { password, confirmPassword } = req.body as any;

    if (password !== confirmPassword) {
        return reply.status(400).send({
            success: false,
            message: "Passwords do not match",
        });
    }
}