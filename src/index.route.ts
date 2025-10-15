import { FastifyInstance } from "fastify";
import authRoutes from "./auth/auth.route.js";
import userRoutes from "./user/user.route.js";
import investorRoutes from "./investor/investor.route.js";
import businessRoutes from "./business/business.route.js";
import invoiceRoutes from "./invoice/invoice.route.js";
import investmentRoutes from "./investment/investment.route.js";
import corporateRoutes from "./corporate/corporate.route.js";
import poolRoutes from "./pool/pool.route.js";

export const indexRoute = async (app: FastifyInstance) => {
    app.register(authRoutes, { prefix: "/api/v1/auth" });

    app.register(corporateRoutes, { prefix: "/api/v1/corporate" });

    app.register(investmentRoutes, { prefix: "/api/v1/investment" });

    app.register(poolRoutes, { prefix: "/api/v1/pool" });

    app.register(invoiceRoutes, { prefix: '/api/v1/invoice' });

    app.register(userRoutes, { prefix: "/api/v1/user" });

    app.register(investorRoutes, { prefix: "/api/v1/investor" });

    app.register(businessRoutes, { prefix: "/api/v1/business" });
};