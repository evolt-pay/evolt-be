import { accountIdPattern } from "constant/common";
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
    description: "Generate a unique nonce for investor Hedera account verification",
    tags: ["auth"],
    querystring: {
        type: "object",
        required: ["accountId"],
        properties: {
            accountId: {
                type: "string",
                pattern: accountIdPattern,
                description: "Hedera account ID (e.g., 0.0.12345)",
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
                        nonce: {
                            type: "string",
                            description: "Randomly generated challenge (nonce) to be signed by the wallet",
                        },
                    },
                },
            },
        },
    },
};


export const InvestorVerifySignatureSchema: FastifySchema = {
    description: "Verify Hedera wallet signature and issue JWT for authenticated sessions",
    tags: ["auth"],
    body: {
        type: "object",
        required: ["publicKey", "accountId", "signature", "message"],
        properties: {
            accountId: {
                type: "string",
                pattern: accountIdPattern,
                description: "Hedera account ID (e.g., 0.0.12345)",
            },
            signature: {
                type: "string",
                description: "Signature of the nonce message from the Hedera wallet",
            },
            message: {
                type: "string",
                description: "Signature of the nonce message from the Hedera wallet",
            },
            publicKey: {
                type: "string",
                description: "Signature of the nonce message from the Hedera wallet",
            }
        },
    },
    response: {
        200: {
            description: "Successful signature verification and JWT token issuance",
            type: "object",
            properties: {
                success: { type: "boolean" },
                message: { type: "string" },
                data: {
                    type: "object",
                    properties: {
                        token: {
                            type: "string",
                            description: "JWT token for authenticated investor session",
                        },
                    },
                },
            },
        },
    },
};


export const ValidateTokenSchema: FastifySchema = {
    description: "Validate JWT token to confirm session validity",
    tags: ["auth"],
    headers: {
        type: "object",
        properties: {
            authorization: {
                type: "string",
                description: "Bearer JWT token",
            },
        },
        required: ["authorization"],
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
                        valid: { type: "boolean" },
                        accountId: { type: "string" },
                        evmAddress: { type: "string" },
                        expiresAt: { type: "string" },
                    },
                },
            },
        },
    },
};


export const RefreshTokenSchema: FastifySchema = {
    description: "Rotate refresh token and issue new access + refresh tokens",
    tags: ["auth"],
    body: {
        type: "object",
        properties: {
            refreshToken: { type: "string" },
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
                        refreshToken: { type: "string" },
                        role: { type: "string" },
                    },
                    required: ["token", "refreshToken"],
                },
            },
        },
    },
};

export const LogoutSchema: FastifySchema = {
    description: "Invalidate the current refresh token",
    tags: ["auth"],
    body: {
        type: "object",
        properties: {
            refreshToken: { type: "string" },
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