import { FastifySchema } from "fastify";

export const WithdrawSchema: FastifySchema = {
    description: "Withdraw vUSD and receive equivalent USDC/USDT",
    tags: ["wallet", "withdraw"],
    body: {
        type: "object",
        required: ["investorAccountId", "token", "amount", "txId"],
        properties: {
            investorAccountId: { type: "string" },
            token: { type: "string", enum: ["USDC", "USDT"] },
            amount: { type: "number", minimum: 1 },
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
                        token: { type: "string" },
                        amount: { type: "number" },
                        txId: { type: "string" },
                        treasury: { type: "string" },
                    },
                },
            },
        },
    },
};