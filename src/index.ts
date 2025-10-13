import * as fastify from 'fastify';
import { ajvFilePlugin } from '@fastify/multipart';
import { config } from './config/app.js';
import dotenv from 'dotenv';
dotenv.config();

import { corePlugin } from './plugin/index.js';

const app = fastify.default({
    logger: {
        transport: {
            target: 'pino-pretty',
            options: {
                colorize: true,
                translateTime: 'HH:MM:ss Z',
                ignore: 'pid,hostname',
            },
        },
    },
    ajv: {
        plugins: [ajvFilePlugin],
    },
});

app.register(corePlugin);

const start = async (): Promise<void> => {
    try {
        await app.ready();
        await app.listen({ port: config.app.port });
    } catch (err) {
        app.log.error(err);
        process.exit(1);
    }
};
start();

export default app;
