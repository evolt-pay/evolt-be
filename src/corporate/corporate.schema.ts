import { FastifySchema } from "fastify";

export const CreateCorporateSchema: FastifySchema = {
    description: "Create a new corporate record (e.g. Honeywell, Dangote)",
    tags: ["corporate"],
    consumes: ['multipart/form-data'],
    summary: "Upload invoice PDF and create invoice record",
    // body: {
    //     type: "object",
    //     required: ["name", "email"],
    //     properties: {
    //         name: { type: "string" },
    //         email: { type: "string", format: "email" },
    //         phone: { type: "string" },
    //         contactPerson: { type: "string" },
    //         description: { type: "string" },
    //         logoUrl: { type: "string" },
    //         verified: { type: "boolean" },
    //     },
    // },
};

export const GetAllCorporatesSchema: FastifySchema = {
    description: "Get all registered corporates",
    tags: ["corporate"],
    response: {
        200: {
            type: "object",
            properties: {
                success: { type: "boolean" },
                message: { type: "string" },
                data: {
                    type: "array",
                    items: {
                        type: "object",
                        properties: {
                            _id: { type: "string" },
                            name: { type: "string" },
                            email: { type: "string" },
                            phone: { type: "string" },
                            contactPerson: { type: "string" },
                            description: { type: "string" },
                            logoUrl: { type: "string" },
                            verified: { type: "boolean" },
                        },
                    },
                },
            },
        },
    },
};