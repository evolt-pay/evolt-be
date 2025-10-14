import { FastifySchema } from "fastify";

export const GetAllPoolsSchema: FastifySchema = {
    description: "Fetch all available investment pools with funding progress",
    tags: ["investment"],
    querystring: {
        type: "object",
        properties: {
            page: { type: "number", default: 1 },
            limit: { type: "number", default: 20 },
            status: {
                type: "string",
                enum: ["funding", "funded", "fully_funded", "all"],
                default: "all",
            },
            search: { type: "string" },
        },
    },
    response: {
        200: {
            description: "Investment pools fetched successfully",
            type: "object",
            properties: {
                success: { type: "boolean" },
                message: { type: "string" },
                data: {
                    type: "object",
                    properties: {
                        page: { type: "number" },
                        limit: { type: "number" },
                        total: { type: "number" },
                        items: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    _id: { type: "string" },
                                    projectName: { type: "string" },
                                    businessName: { type: "string" },
                                    apy: { type: "number" },
                                    minInvestment: { type: "number" },
                                    maxInvestment: { type: "number" },
                                    totalTarget: { type: "number" },
                                    fundedAmount: { type: "number" },
                                    fundingProgress: { type: "number" },
                                    status: { type: "string" },
                                    daysLeft: { type: "number" },
                                    expiryDate: { type: "string" },
                                    blobUrl: { type: "string" },
                                },
                            },
                        },
                    },
                },
            },
        },
    },
};

export const GetPoolDetailsSchema: FastifySchema = {
    description: "Fetch detailed information about a single investment pool",
    tags: ["investment"],
    params: {
        type: "object",
        required: ["invoiceId"],
        properties: {
            invoiceId: { type: "string" },
        },
    },
    response: {
        200: {
            description: "Pool details fetched successfully",
            type: "object",
            properties: {
                success: { type: "boolean" },
                message: { type: "string" },
                data: {
                    type: "object",
                    properties: {
                        invoiceNumber: { type: "string" },
                        businessName: { type: "string" },
                        businessDescription: { type: "string" },
                        corporateName: { type: "string" },
                        corporateDescription: { type: "string" },
                        fundedAmount: { type: "number" },
                        totalInvestors: { type: "number" },
                        apy: { type: "number" },
                        durationInDays: { type: "number" },
                        verifier: { type: "string" },
                        verifiedAt: { type: "string" },
                        hcsTxId: { type: "string" },
                        blobUrl: { type: "string" },
                    },
                },
            },
        },
    },
};