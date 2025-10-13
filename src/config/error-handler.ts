import {
    FastifyInstance,
    FastifyError,
    FastifyReply,
    FastifyRequest,
} from 'fastify';
import { Error } from 'mongoose';

export function errorHandlerPlugin(
    fastify: FastifyInstance,
    opts: any,
    done: () => void,
) {
    fastify.setErrorHandler(
        (error: FastifyError, request: FastifyRequest, reply: FastifyReply) => {
            console.log(error);
            let statusCode = 500;
            let message = 'Internal Server Error';
            let details: any = null;

            // Mongoose Validation Error
            const MongooseValidationError = Error.ValidationError;
            if (error instanceof MongooseValidationError) {
                statusCode = 400;
                message = 'Validation failed';
                details = Object.values(error.errors).map((e) => e.message);
            }

            // Fastify built-in HTTP errors or thrown manually with `httpErrors`
            else if (error.statusCode && error.message) {
                statusCode = error.statusCode;
                message = error.message;
            }

            // Unknown errors
            else {
                message = error.message || message;
            }

            reply.status(statusCode).send({
                statusCode,
                message,
                details,
                timestamp: new Date().toISOString(),
                path: request.url,
            });
        },
    );

    done();
}
