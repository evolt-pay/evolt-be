import { FastifySchema } from "fastify";


export const AirdropSchema: FastifySchema = {
    description: "Sandbox airdrop: send vUSD to many recipients (testnet only)",
    tags: ["airdrop"],
    headers: {
        type: "object",
        properties: {
            "x-sandbox-token": { type: "string" },
        },
        required: ["x-sandbox-token"],
    },
    body: {
        type: "object",
        required: ["recipients"],
        properties: {
            defaultAmount: { type: "number", minimum: 1, default: 100 },
            recipients: {
                type: "array",
                minItems: 1,
                items: {
                    type: "object",
                    required: ["accountId"],
                    properties: {
                        accountId: { type: "string", description: "Hedera account (e.g., 0.0.12345)" },
                        amount: { type: "number", minimum: 1, description: "Overrides defaultAmount for this recipient" },
                    },
                },
            },
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
                        tokenId: { type: "string" },
                        totalRecipients: { type: "number" },
                        totalRequested: { type: "number" },
                        totalSucceeded: { type: "number" },
                        totalFailed: { type: "number" },
                        results: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    to: { type: "string" },
                                    amount: { type: "number" },
                                    status: { type: "string" },
                                    txId: { type: "string", nullable: true },
                                    error: { type: "string", nullable: true },
                                },
                            },
                        },
                    },
                },
            },
        },
    },
};