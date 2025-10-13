import { FastifyInstance, RouteOptions } from "fastify";
import InvoiceController from "./invoice.controller";
import { RouteMethods } from "@util/util.dto";
import { authenticate } from "@middleware/index";
import {
    CreateInvoiceSchema,
    VerifyInvoiceSchema,
    GetInvoiceSchema,
    GetVerifiedInvoicesSchema
} from "./invoice.schema";

export default async function invoiceRoutes(app: FastifyInstance) {
    const routes: RouteOptions[] = [
        {
            method: RouteMethods.POST,
            url: "/",
            // preHandler: [authenticate], // Enable when needed
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
            preHandler: [authenticate],
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