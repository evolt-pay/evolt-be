import { FastifyInstance } from 'fastify';
import authRoutes from './auth/auth.route.js';
import userRoutes from './user/user.route.js';


export const indexRoute = function (app: FastifyInstance) {

    app.register(async (app) => {
        await authRoutes(app);
    }, { prefix: '/api/v1/auth' });


    app.register(async (app) => {
        await userRoutes(app);
    }, { prefix: '/api/v1/user' });


};
