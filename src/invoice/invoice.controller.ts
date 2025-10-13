import { FastifyRequest, FastifyReply } from "fastify";
import InvoiceService from "./invoice.service.js";

class InvoiceController {
    async createInvoice(req: FastifyRequest, reply: FastifyReply) {
        try {
            const { user } = req as any;

            // 🔹 Because `attachFieldsToBody: true`, everything is in req.body
            const body = req.body as any;
            // 🔹 Extract file from body
            const fileField = body.files;

            if (!fileField || !fileField.toBuffer) {
                return reply.status(400).send({ message: "Invoice file is required" });
            }

            // 🔹 Convert stream to buffer
            const buffer = await fileField.toBuffer();

            // 🔹 Normalize the rest of the form fields
            const data: Record<string, any> = {};
            for (const [key, val] of Object.entries(body)) {
                if (key !== "file") data[key] = (val as any).value ?? val;
            }

            // 🔹 Proceed to create the invoice
            const invoice = await InvoiceService.createInvoice(
                user.id,
                data,
                {
                    buffer,
                    filename: fileField.filename,
                    mimetype: fileField.mimetype,
                }
            );

            return reply.code(201).send({
                message: "Invoice created successfully",
                data: invoice,
            });
        } catch (error: any) {
            console.error("Create invoice error:", error);
            return reply.code(500).send({ message: error.message || "Internal Server Error" });
        }
    }

    async verifyInvoice(req: FastifyRequest, reply: FastifyReply) {
        try {
            const { id, verifier, corporateName } = req.body as any;
            const result = await InvoiceService.verifyInvoice(id, verifier, corporateName);
            return reply.code(200).send({
                message: "Invoice verified successfully",
                data: result,
            });
        } catch (error: any) {
            console.error("Verify invoice error:", error);
            return reply.code(400).send({ message: error.message });
        }
    }

    async getInvoice(req: FastifyRequest, reply: FastifyReply) {
        try {
            const { id } = req.params as any;
            const invoice = await InvoiceService.getInvoiceById(id);
            if (!invoice) return reply.code(404).send({ message: "Invoice not found" });
            return reply.code(200).send({ data: invoice });
        } catch (error: any) {
            return reply.code(500).send({ message: error.message });
        }
    }
    async getVerifiedInvoices(_req: FastifyRequest, reply: FastifyReply) {
        try {
            const invoices = await InvoiceService.getVerifiedInvoices();
            return reply.code(200).send({
                message: "Verified invoices ready for tokenization or investment",
                data: invoices,
            });
        } catch (error: any) {
            console.error("Fetch verified invoices error:", error);
            return reply.code(500).send({ message: error.message || "Internal Server Error" });
        }
    }

}

export default new InvoiceController();