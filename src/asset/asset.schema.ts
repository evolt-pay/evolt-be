import { FastifySchema } from "fastify";

export const CreateAssetSchema: FastifySchema = {
    description: "Create a new asset (invoice, agriculture, real estate, creator IP, or receivable)",
    tags: ["asset"],
    consumes: ["multipart/form-data"],
    summary: "Upload asset document and create an asset record",
    response: {
        201: {
            description: "Asset created successfully",
            type: "object",
            properties: {
                success: { type: "boolean" },
                message: { type: "string" },
                data: {
                    type: "object",
                    properties: {
                        _id: { type: "string" },
                        assetType: { type: "string" },
                        amount: { type: "number" },
                        currency: { type: "string" },
                        status: { type: "string" },
                        blobUrl: { type: "string" },
                        yieldRate: { type: "number" },
                        durationDays: { type: "number" },
                    },
                },
            },
        },
    },
};

export const VerifyAssetSchema: FastifySchema = {
    description: "Verify an asset submission (by corporate or validator)",
    tags: ["asset"],
    summary: "Mark asset as verified and trigger tokenization",
    body: {
        type: "object",
        required: ["id", "verifier"],
        properties: {
            id: { type: "string", minLength: 10 },
            verifier: { type: "string" },
        },
    },
    response: {
        200: {
            description: "Asset verified and tokenized successfully",
            type: "object",
            properties: {
                success: { type: "boolean" },
                message: { type: "string" },
                data: {
                    type: "object",
                    properties: {
                        tokenId: { type: "string" },
                        tokenEvm: { type: "string" },
                        assetId: { type: "string" },
                    },
                },
            },
        },
    },
};

export const GetAssetSchema: FastifySchema = {
    description: "Fetch a single asset by ID",
    tags: ["asset"],
    summary: "Retrieve asset details",
    params: {
        type: "object",
        required: ["id"],
        properties: {
            id: { type: "string" },
        },
    },
    response: {
        200: {
            description: "Asset fetched successfully",
            type: "object",
            properties: {
                success: { type: "boolean" },
                data: {
                    type: "object",
                    properties: {
                        _id: { type: "string" },
                        assetType: { type: "string" },
                        amount: { type: "number" },
                        currency: { type: "string" },
                        status: { type: "string" },
                        blobUrl: { type: "string" },
                        tokenId: { type: "string" },
                        verifiedAt: { type: "string" },
                    },
                },
            },
        },
    },
};

export const GetAssetsByTypeSchema: FastifySchema = {
    description: "Fetch all assets by asset type (e.g. invoice, real_estate, agriculture)",
    tags: ["asset"],
    summary: "Get assets by type",
    params: {
        type: "object",
        required: ["type"],
        properties: {
            type: {
                type: "string",
                enum: ["all", "invoice", "real_estate", "agriculture", "creator_ip", "receivable"],
                description: "Type of asset to filter by",
            },
        },
    },
    response: {
        200: {
            description: "Assets of the specified type fetched successfully",
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
                            assetType: { type: "string" },
                            status: { type: "string" },
                            tokenName: { type: "string" },
                            amount: { type: "number" },
                            currency: { type: "string" },
                            yieldRate: { type: "number" },
                            totalTarget: { type: "number" },
                            minInvestment: { type: "number" },
                            maxInvestment: { type: "number" },
                            expiryDate: { type: "string", format: "date-time" },
                            blobUrl: { type: "string" },
                            createdAt: { type: "string", format: "date-time" },
                            updatedAt: { type: "string", format: "date-time" },
                        },
                    },
                },
            },
        },
    },
};

export const GetVerifiedAssetsSchema: FastifySchema = {
    description: "Fetch all verified assets ready for investment",
    tags: ["asset"],
    response: {
        200: {
            description: "Verified assets fetched successfully",
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
                            assetType: { type: "string" },
                            amount: { type: "number" },
                            currency: { type: "string" },
                            status: { type: "string" },
                            tokenId: { type: "string" },
                            tokenEvm: { type: "string" },
                            blobUrl: { type: "string" },
                            verifiedAt: { type: "string" },
                            // tokenized: { type: "boolean" },
                        },
                    },
                },
            },
        },
    },
};