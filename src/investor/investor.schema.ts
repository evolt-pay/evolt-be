import { FastifySchema } from "fastify";

const Investment = {
    type: "object",
    properties: {
        id: { type: "string" },
        poolName: { type: "string" },
        subtitle: { type: "string", nullable: true },
        tokenId: { type: "string" },
        invoiceId: { type: "string", nullable: true },
        invoiceNumber: { type: "string", nullable: true },
        logoUrl: { type: "string", nullable: true },

        vusdAmount: { type: "number" },
        iTokenAmount: { type: "number", nullable: true },

        yieldRate: { type: "number" },
        dailyPct: { type: "number" },
        expectedYield: { type: "number" },
        earningsToDate: { type: "number" },
        earningsPctToDate: { type: "number" },

        createdAt: { type: "string" },
        maturedAt: { type: "string", nullable: true },
        status: { type: "string", enum: ["active", "completed"] },
    },
    required: [
        "id",
        "poolName",
        "tokenId",
        "vusdAmount",
        "yieldRate",
        "dailyPct",
        "expectedYield",
        "earningsToDate",
        "earningsPctToDate",
        "createdAt",
        "status",
    ],
    additionalProperties: false,
} as const;

export const GetInvestorInvestmentsSchema: FastifySchema = {
    description: "List raw investments for an investor wallet",
    tags: ["Investor"],
    response: {
        200: {
            type: "object",
            properties: {
                success: { type: "boolean" },
                message: { type: "string" },
                data: {
                    type: "object",
                    properties: {
                        investor: {
                            type: "object",
                            properties: {
                                _id: { type: "string" },
                                accountId: { type: "string" },
                                approved: { type: "boolean" },
                            },
                            additionalProperties: true,
                        },
                        investments: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    _id: { type: "string" },
                                    investorId: { type: "string" },
                                    investorWallet: { type: "string", nullable: true },
                                    tokenId: { type: "string" },
                                    tokenEvm: { type: "string", nullable: true },
                                    invoiceNumber: { type: "string", nullable: true },
                                    vusdAmount: { type: "number" },
                                    iTokenAmount: { type: "number", nullable: true },
                                    yieldRate: { type: "number", nullable: true },
                                    expectedYield: { type: "number", nullable: true },
                                    status: { type: "string" },
                                    createdAt: { type: "string" },
                                    maturedAt: { type: "string", nullable: true },
                                },
                                additionalProperties: true,
                            },
                        },
                    },
                },
            },
        },
    },
};

export const GetInvestorPortfolioSchema: FastifySchema = {
    description: "Investment cards + totals for an investor wallet",
    tags: ["Investor"],
    response: {
        200: {
            type: "object",
            properties: {
                success: { type: "boolean" },
                message: { type: "string" },
                data: {
                    type: "object",
                    properties: {
                        pending: {
                            type: "array",
                            items: Investment,
                        },
                        completed: {
                            type: "array",
                            items: Investment,
                        },
                        totals: {
                            type: "object",
                            properties: {
                                tvlPending: { type: "number" },
                                earningsToDatePending: { type: "number" },
                            },
                            required: ["tvlPending", "earningsToDatePending"],
                        },
                    },
                    required: ["pending", "completed", "totals"],
                },
            },
        },
    },
};