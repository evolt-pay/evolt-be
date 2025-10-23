import { FastifySchema } from "fastify";


export const CreateWalletSchema: FastifySchema = {
    description: "Create an alias-based Hedera wallet and store its private key in Azure Key Vault",
    tags: ["wallet"],
    body: {
        type: "object",
        required: ["userId"],
        properties: {
            userId: { type: "string" },
        },
    },
    response: {
        200: {
            type: "object",
            properties: {
                success: { type: "boolean" },
                message: { type: "string" },
                data: {
                    type: "object",
                    properties: {
                        alias: { type: "string" },
                        publicKey: { type: "string" },
                    },
                },
            },
        },
    },
};