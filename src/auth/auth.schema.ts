import { FastifySchema } from "fastify";

export const SendOtpSchema: FastifySchema = {
    description: "Send OTP to user email",
    tags: ["auth"],
    body: {
        type: "object",
        required: ["email"],
        properties: {
            email: { type: "string", format: "email" },
        },
    },
};


export const SignupSchema: FastifySchema = {
    description: "Sign up (creates pending user and sends OTP to email)",
    tags: ["auth"],
    body: {
        type: "object",
        required: [
            "firstName",
            "lastName",
            "email",
            "country",
            "accountType",
            "password",
            "confirmPassword",
        ],
        properties: {
            firstName: { type: "string", minLength: 2 },
            lastName: { type: "string", minLength: 2 },
            email: { type: "string", format: "email" },
            otherName: { type: "string" },
            country: { type: "string" },
            phoneNumber: { type: "string" },
            accountType: { type: "string", enum: ["investor", "business"] },
            password: { type: "string", minLength: 6 },
            confirmPassword: { type: "string", minLength: 6 },
        },
    },
    response: {
        200: {
            type: "object",
            properties: {
                success: { type: "boolean" },
                message: { type: "string" },
            },
        },
    },
};

export const VerifyOtpSchema: FastifySchema = {
    description: "Verify OTP and issue JWT",
    tags: ["auth"],
    body: {
        type: "object",
        required: ["email", "otp"],
        properties: {
            email: { type: "string", format: "email" },
            otp: { type: "string", minLength: 6, maxLength: 6 },
        },
    },
};

export const SetPasswordSchema: FastifySchema = {
    description: "Set password after OTP verification",
    tags: ["auth"],
    body: {
        type: "object",
        required: ["password"],
        properties: {
            password: { type: "string", minLength: 6 },
        },
    },
};

export const LoginSchema: FastifySchema = {
    description: "Login user and get JWT",
    tags: ["auth"],
    body: {
        type: "object",
        required: ["email", "password"],
        properties: {
            email: { type: "string", format: "email" },
            password: { type: "string", minLength: 6 },
        },
    },
};

export const InvestorNonceSchema: FastifySchema = {
    description: "Generate nonce for investor wallet verification (Web3 Auth)",
    tags: ["auth", "investor"],
    querystring: {
        type: "object",
        required: ["walletAddress"],
        properties: {
            walletAddress: {
                type: "string",
                pattern: "^0x[a-fA-F0-9]{40}$",
                description: "Investor wallet address (EVM-compatible)",
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
                        nonce: { type: "string", description: "Unique message nonce to be signed by wallet" },
                    },
                },
            },
        },
    },
};

export const InvestorVerifyWalletSchema: FastifySchema = {
    description: "Verify investor wallet signature and issue JWT token",
    tags: ["auth", "investor"],
    body: {
        type: "object",
        required: ["walletAddress", "signature"],
        properties: {
            walletAddress: {
                type: "string",
                pattern: "^0x[a-fA-F0-9]{40}$",
                description: "Investor wallet address (EVM-compatible)",
            },
            signature: {
                type: "string",
                description: "Signature of the nonce message from the investor’s wallet",
            },
        },
    },
    response: {
        200: {
            description: "Successful wallet verification and token issuance",
            type: "object",
            properties: {
                success: { type: "boolean" },
                message: { type: "string" },
                data: {
                    type: "object",
                    properties: {
                        token: {
                            type: "string",
                            description: "JWT authentication token for investor wallet session",
                        },
                    },
                },
            },
        },
    },
};