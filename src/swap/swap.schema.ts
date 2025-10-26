import { FastifySchema } from "fastify";

/* ======================================================
    DEPOSIT (USDC/USDT → vUSD)
====================================================== */
export const PrepareDepositSchema: FastifySchema = {
    description: "Prepare a deposit (USDC/USDT → vUSD)",
    tags: ["wallet", "swap"],
    body: {
        type: "object",
        required: ["accountId", "amount", "token"],
        properties: {
            accountId: { type: "string" },
            amount: { type: "number", minimum: 1 },
            token: { type: "string", enum: ["USDC", "USDT"] },
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
                        treasury: { type: "string" },
                        memo: { type: "string" },
                    },
                },
            },
        },
    },
};

export const SettleDepositSchema: FastifySchema = {
    description: "Verify user stablecoin transfer and credit vUSD",
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

/* ======================================================
    WITHDRAW (vUSD → USDC/USDT)
====================================================== */
export const PrepareWithdrawSchema: FastifySchema = {
    description: "Prepare a withdrawal (vUSD → USDC/USDT)",
    tags: ["wallet", "swap"],
    body: {
        type: "object",
        required: ["investorAccountId", "amount", "token"],
        properties: {
            accountId: { type: "string" },
            amount: { type: "number", minimum: 1 },
            token: { type: "string", enum: ["USDC", "USDT"] },
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
                        treasury: { type: "string" },
                        memo: { type: "string" },
                    },
                },
            },
        },
    },
};

export const SettleWithdrawSchema: FastifySchema = {
    description: "Verify vUSD deposit and release USDC/USDT",
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
                        txId: { type: "string" },
                    },
                },
            },
        },
    },
};

export const FaucetUSDCSchema: FastifySchema = {
    description: "Send test USDC from treasury to a user (faucet)",
    tags: ["wallet", "swap"],
    body: {
        type: "object",
        required: ["accountId", "amount"],
        properties: {
            accountId: { type: "string" },
            amount: { type: "number", minimum: 0.000001 },
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
                        txId: { type: "string" },
                        status: { type: "string" },
                        minted: { type: "boolean" },
                    },
                },
            },
        },
    },
};