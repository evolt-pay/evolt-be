import { FastifySchema } from "fastify";

const CorporateEntity = {
    type: "object",
    properties: {
        _id: { type: "string" },
        name: { type: "string" },
        email: { type: "string" },
        phone: { type: "string", nullable: true },
        contactPerson: { type: "string", nullable: true },
        description: { type: "string", nullable: true },
        logoUrl: { type: "string", nullable: true },
        verified: { type: "boolean" },
        createdAt: { type: "string", format: "date-time" },
        updatedAt: { type: "string", format: "date-time" },
    },
    required: ["_id", "name", "email", "verified", "createdAt", "updatedAt"],
    additionalProperties: false,
} as const;

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
    description: "List all corporates",
    tags: ["corporate"],
    response: {
        200: {
            description: "Corporates fetched",
            type: "object",
            properties: {
                success: { type: "boolean" },
                message: { type: "string" },
                data: {
                    type: "array",
                    items: CorporateEntity,
                },
            },
            required: ["success", "message", "data"],
            additionalProperties: false,
        },
    },
};

export const GetCorporateByIdSchema: FastifySchema = {
    description: "Get a single corporate by ID",
    tags: ["corporate"],
    params: {
        type: "object",
        required: ["id"],
        properties: { id: { type: "string" } },
    },
    response: {
        200: {
            description: "Corporate fetched",
            type: "object",
            properties: {
                success: { type: "boolean" },
                message: { type: "string" },
                data: CorporateEntity,
            },
            required: ["success", "message", "data"],
            additionalProperties: false,
        },
        404: {
            description: "Corporate not found",
            type: "object",
            properties: {
                success: { type: "boolean" },
                message: { type: "string" },
            },
            required: ["success", "message"],
            additionalProperties: false,
        },
    },
};

export const UpdateCorporateSchema: FastifySchema = {
    description: "Update a corporate by ID",
    tags: ["corporate"],
    params: {
        type: "object",
        required: ["id"],
        properties: { id: { type: "string" } },
    },
    body: {
        type: "object",
        properties: {
            name: { type: "string" },
            email: { type: "string" },
            phone: { type: "string" },
            contactPerson: { type: "string" },
            description: { type: "string" },
            logoUrl: { type: "string" },
            verified: { type: "boolean" },
        },
        additionalProperties: false,
    },
    response: {
        200: {
            description: "Corporate updated",
            type: "object",
            properties: {
                success: { type: "boolean" },
                message: { type: "string" },
                data: CorporateEntity,
            },
            required: ["success", "message", "data"],
            additionalProperties: false,
        },
        404: {
            description: "Corporate not found",
            type: "object",
            properties: {
                success: { type: "boolean" },
                message: { type: "string" },
            },
            required: ["success", "message"],
            additionalProperties: false,
        },
    },
};

export const DeleteCorporateSchema: FastifySchema = {
    description: "Delete a corporate by ID",
    tags: ["corporate"],
    params: {
        type: "object",
        required: ["id"],
        properties: { id: { type: "string" } },
    },
    response: {
        200: {
            description: "Corporate deleted",
            type: "object",
            properties: {
                success: { type: "boolean" },
                message: { type: "string" },
                data: {
                    type: "object",
                    properties: {
                        success: { type: "boolean" },
                    },
                    required: ["success"],
                    additionalProperties: false,
                },
            },
            required: ["success", "message", "data"],
            additionalProperties: false,
        },
        404: {
            description: "Corporate not found",
            type: "object",
            properties: {
                success: { type: "boolean" },
                message: { type: "string" },
            },
            required: ["success", "message"],
            additionalProperties: false,
        },
    },
};