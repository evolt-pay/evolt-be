import { FastifySchema } from "fastify";

export const PrepareSwapSchema: FastifySchema = {
    description: "Prepare a USDT/USDC → vUSD swap (user-signed)",
    tags: ["wallet", "swap"],
    body: {
        type: "object",
        required: ["accountId", "amount"],
        properties: {
            accountId: { type: "string" },
            amount: { type: "number", minimum: 10 },
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
                        accountId: { type: "string" },
                        token: { type: "string" },
                        amount: { type: "number" },
                        vusdAmount: { type: "number" },
                        txId: { type: "string" },
                        transactionB64: { type: "string" },
                        treasury: { type: "string" },
                    },
                },
            },
        },
    },
};

export const SettleSwapSchema: FastifySchema = {
    description: "Verify swap on mirror node and credit vUSD 1:1",
    tags: ["wallet", "swap"],
    body: {
        type: "object",
        required: ["investorAccountId", "token", "amount", "txId"],
        properties: {
            investorAccountId: { type: "string" },
            token: { type: "string", enum: ["USDC", "USDT"] },
            amount: { type: "number" },
            txId: { type: "string" },
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
                        minted: { type: "boolean" },
                        transferred: { type: "boolean" },
                    },
                },
            },
        },
    },
};