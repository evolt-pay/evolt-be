import { FastifySchema } from "fastify";


export const CreateInvestmentSchema: FastifySchema = {
    description: "Record a new investment and deliver iTokens to investor",
    tags: ["investment"],
    summary: "Investor purchases asset token (iToken)",
    body: {
        type: "object",
        required: ["assetId", "txId"],
        properties: {
            assetId: { type: "string", description: "Mongo _id of the asset/pool" },
            txId: { type: "string", description: "Hedera transaction ID of the vUSD transfer" },
        },
    },
    response: {
        201: {
            description: "Investment recorded successfully",
            type: "object",
            properties: {
                message: { type: "string" },
                data: {
                    type: "object",
                    properties: {
                        _id: { type: "string" },
                        tokenId: { type: "string" },
                        tokenName: { type: "string" },
                        vusdAmount: { type: "number" },
                        iTokenAmount: { type: "number" },
                        yieldRate: { type: "number" },
                        expectedYield: { type: "number" },
                        status: { type: "string" },
                        maturedAt: { type: "string" },
                        txId: { type: "string" },
                    },
                },
            },
        },
    },
};


export const GetAllInvestmentsSchema: FastifySchema = {
    description: "Fetch all recorded investments",
    tags: ["investment"],
    summary: "Get all investor records",
    response: {
        200: {
            description: "All investments fetched successfully",
            type: "object",
            properties: {
                message: { type: "string" },
                data: {
                    type: "array",
                    items: {
                        type: "object",
                        properties: {
                            _id: { type: "string" },
                            investorId: { type: "string" },
                            tokenId: { type: "string" },
                            tokenName: { type: "string" },
                            vusdAmount: { type: "number" },
                            iTokenAmount: { type: "number" },
                            yieldRate: { type: "number" },
                            expectedYield: { type: "number" },
                            status: { type: "string" },
                            maturedAt: { type: "string" },
                            txId: { type: "string" },
                            createdAt: { type: "string" },
                        },
                    },
                },
            },
        },
    },
};


export const GetInvestmentsByInvestorSchema: FastifySchema = {
    description: "Fetch all investments by a specific investor",
    tags: ["investment"],
    summary: "Investor investment records",
    params: {
        type: "object",
        required: ["investorId"],
        properties: {
            investorId: { type: "string", description: "Investor Hedera account ID" },
        },
    },
    response: {
        200: {
            description: "Investments fetched successfully for investor",
            type: "object",
            properties: {
                message: { type: "string" },
                data: {
                    type: "array",
                    items: {
                        type: "object",
                        properties: {
                            _id: { type: "string" },
                            tokenId: { type: "string" },
                            tokenName: { type: "string" },
                            vusdAmount: { type: "number" },
                            iTokenAmount: { type: "number" },
                            yieldRate: { type: "number" },
                            expectedYield: { type: "number" },
                            status: { type: "string" },
                            maturedAt: { type: "string" },
                        },
                    },
                },
            },
        },
    },
};


export const SettleInvestmentsSchema: FastifySchema = {
    description: "Settle all matured investments and distribute yield in vUSD",
    tags: ["investment"],
    summary: "Yield payout settlement for matured investments",
    response: {
        200: {
            description: "Matured investments settled successfully",
            type: "object",
            properties: {
                message: { type: "string" },
                data: {
                    type: "object",
                    properties: {
                        settled: { type: "number", description: "Number of investments settled" },
                    },
                },
            },
        },
    },
};
