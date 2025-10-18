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
                                    corporateName: { type: "string" },
                                    corporateLogo: { type: "string" },
                                    yieldRate: { type: "number" },
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
                        tokenId: { type: "string", nullable: true },
                        escrowContractId: { type: "string", nullable: true },
                        _id: { type: "string" },
                        // business / corporate presentation
                        invoiceNumber: { type: "string" },
                        businessName: { type: "string" },
                        businessDescription: { type: "string" },
                        corporateName: { type: "string" },
                        corporateLogo: { type: "string", nullable: true },
                        corporateDescription: { type: "string" },

                        // funding stats (off-chain + on-chain)
                        fundedAmount: { type: "number" },
                        totalInvestors: { type: "number" },
                        stakerCountOnChain: { type: "number" },

                        // economics / limits
                        yieldRate: { type: "number" },
                        durationInDays: { type: "number" },
                        minInvestment: { type: "number" },
                        maxInvestment: { type: "number" },
                        totalTarget: { type: "number" },
                        expiryDate: { type: "string", format: "date-time", nullable: true },

                        // audit
                        verifier: { type: "string", nullable: true },
                        verifiedAt: { type: "string", format: "date-time", nullable: true },
                        hcsTxId: { type: "string", nullable: true },
                        blobUrl: { type: "string", nullable: true },
                    },
                },
            },
        },
    },
};