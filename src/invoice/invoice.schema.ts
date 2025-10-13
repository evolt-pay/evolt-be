import { FastifySchema } from "fastify";

export const CreateInvoiceSchema: FastifySchema = {
    description: "Create a new invoice for verification",
    tags: ["invoice"],
    consumes: ['multipart/form-data'],
    summary: "Upload invoice PDF and create invoice record",
    // body: {
    //     type: "object",
    //     required: ["invoiceNumber", "amount", "currency", "corporateEmail"],
    //     properties: {
    //         invoiceNumber: { type: "string", minLength: 1 },
    //         amount: { type: "number", minimum: 1 },
    //         currency: { type: "string", minLength: 3, maxLength: 3 },
    //         businessName: { type: "string" },
    //         corporateName: { type: "string" },
    //         corporateEmail: { type: "string", format: "email" },
    //         dueDate: { type: "string", format: "date-time" },
    //         description: { type: "string" },
    //     },
    // },
    response: {
        201: {
            description: "Invoice created successfully",
            type: "object",
            properties: {
                success: { type: "boolean" },
                message: { type: "string" },
                data: {
                    type: "object",
                    properties: {
                        _id: { type: "string" },
                        invoiceNumber: { type: "string" },
                        amount: { type: "number" },
                        currency: { type: "string" },
                        status: { type: "string" },
                        blobUrl: { type: "string" },
                        token: { type: "string" },
                    },
                },
            },
        },
    },
};

export const VerifyInvoiceSchema: FastifySchema = {
    description: "Verify an invoice via unique token",
    tags: ["invoice"],
    summary: "Corporate verifies invoice authenticity",
    body: {
        type: "object",
        required: ["id", "verifier", "corporateName"],
        properties: {
            id: { type: "string", minLength: 10 },
            verifier: { type: "string" },
            corporateName: { type: "string" },
        },
    },
    response: {
        200: {
            description: "Invoice verified successfully",
            type: "object",
            properties: {
                success: { type: "boolean" },
                message: { type: "string" },
                data: {
                    type: "object",
                    properties: {
                        _id: { type: "string" },
                        invoiceNumber: { type: "string" },
                        status: { type: "string" },
                        verifier: { type: "string" },
                        hcsTxId: { type: "string" },
                    },
                },
            },
        },
    },
};

export const GetInvoiceSchema: FastifySchema = {
    description: "Fetch a single invoice by ID",
    tags: ["invoice"],
    summary: "Get invoice details",
    params: {
        type: "object",
        required: ["id"],
        properties: {
            id: { type: "string" },
        },
    },
    response: {
        200: {
            description: "Invoice fetched successfully",
            type: "object",
            properties: {
                success: { type: "boolean" },
                data: {
                    type: "object",
                    properties: {
                        _id: { type: "string" },
                        invoiceNumber: { type: "string" },
                        amount: { type: "number" },
                        currency: { type: "string" },
                        status: { type: "string" },
                        blobUrl: { type: "string" },
                        hcsTxId: { type: "string" },
                        verifiedAt: { type: "string" },
                    },
                },
            },
        },
    },
};

export const GetVerifiedInvoicesSchema: FastifySchema = {
    description: "Fetch all verified invoices ready for tokenization or investment",
    tags: ["invoice"],
    response: {
        200: {
            description: "Verified invoices fetched successfully",
            type: "object",
            properties: {
                message: { type: "string" },
                data: {
                    type: "array",
                    items: {
                        type: "object",
                        properties: {
                            _id: { type: "string" },
                            invoiceNumber: { type: "string" },
                            amount: { type: "number" },
                            currency: { type: "string" },
                            businessName: { type: "string" },
                            blobUrl: { type: "string" },
                            status: { type: "string" },
                            verifiedAt: { type: "string" },
                            tokenId: { type: "string" },
                            hcsTxId: { type: "string" },
                            tokenized: { type: "boolean" },
                        },
                    },
                },
            },
        },
    },
};