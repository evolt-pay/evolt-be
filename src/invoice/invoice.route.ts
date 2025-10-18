import { FastifyInstance, RouteOptions } from "fastify";
import InvoiceController from "./invoice.controller.js";
import { authenticateUser } from "../middleware/index.js";
import {
    CreateInvoiceSchema,
    VerifyInvoiceSchema,
    GetInvoiceSchema,
    GetVerifiedInvoicesSchema
} from "./invoice.schema.js";
import { RouteMethods } from "../util/util.dto.js";

export default async function invoiceRoutes(app: FastifyInstance) {
    const routes: RouteOptions[] = [
        {
            method: RouteMethods.POST,
            url: "/",
            preHandler: [authenticateUser],
            handler: (req, reply) => InvoiceController.createInvoice(req, reply),
            schema: CreateInvoiceSchema,
        },
        {
            method: RouteMethods.POST,
            url: "/verify",
            handler: (req, reply) => InvoiceController.verifyInvoice(req, reply),
            schema: VerifyInvoiceSchema,
        },
        {
            method: RouteMethods.GET,
            url: "/:id",
            preHandler: [authenticateUser],
            handler: (req, reply) => InvoiceController.getInvoice(req, reply),
            schema: GetInvoiceSchema,
        },
        {
            method: RouteMethods.GET,
            url: "/verified",
            handler: (req, reply) => InvoiceController.getVerifiedInvoices(req, reply),
            schema: GetVerifiedInvoicesSchema,
        },
    ];

    routes.forEach((r) => app.route(r));
}