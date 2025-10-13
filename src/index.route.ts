import { FastifyInstance } from "fastify";
import authRoutes from "./auth/auth.route.js";
import userRoutes from "./user/user.route.js";
import investorRoutes from "./onboard/investor/investor.route.js";
import businessRoutes from "./onboard/business/business.route.js";
import invoiceRoutes from "invoice/invoice.routes.js";

export const indexRoute = async (app: FastifyInstance) => {
    app.register(authRoutes, { prefix: "/api/v1/auth" });

    app.register(invoiceRoutes, { prefix: '/api/v1/invoice' });

    app.register(userRoutes, { prefix: "/api/v1/user" });

    app.register(investorRoutes, { prefix: "/api/v1/onboard" });

    app.register(businessRoutes, { prefix: "/api/v1/onboard" });
};