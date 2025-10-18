import { FastifySchema } from "fastify";

export const OnboardBusinessSchema: FastifySchema = {

    description: "Onboard business (KYB)",
    tags: ["Business"],
    consumes: ["multipart/form-data"],
}

export const GetBusinessSchema: FastifySchema = {
    description: "Fetch the authenticated user's business profile",
    tags: ["business"],
    response: {
        200: {
            description: "Business profile fetched",
            type: "object",
            properties: {
                success: { type: "boolean" },
                message: { type: "string" },
                data: {
                    type: "object",
                    nullable: true,
                    properties: {
                        _id: { type: "string" },
                        userId: { type: "string" },
                        rcNumber: { type: "string", nullable: true },
                        businessName: { type: "string", nullable: true },
                        address: { type: "string", nullable: true },
                        ownershipDocumentUrl: { type: "string", nullable: true },
                        description: { type: "string", nullable: true },
                        kybStatus: { type: "string", enum: ["pending", "approved", "rejected"] },
                        signatories: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    fullName: { type: "string", nullable: true },
                                    email: { type: "string", nullable: true },
                                    phoneNumber: { type: "string", nullable: true },
                                    idUrl: { type: "string", nullable: true },
                                },
                                additionalProperties: false,
                            },
                        },
                        createdAt: { type: "string", format: "date-time" },
                        updatedAt: { type: "string", format: "date-time" },
                    },
                    required: ["_id", "userId", "kybStatus", "signatories", "createdAt", "updatedAt"],
                    additionalProperties: false,
                },
            },
            required: ["success", "message", "data"],
            additionalProperties: false,
        },
        404: {
            description: "Business profile not found",
            type: "object",
            properties: {
                success: { type: "boolean" },
                message: { type: "string" },
            },
            required: ["success", "message"],
            additionalProperties: false,
        },
    },
}