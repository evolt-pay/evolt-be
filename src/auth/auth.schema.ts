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

export const SendSignupOtpSchema: FastifySchema = {
    description: "Send OTP for signup",
    tags: ["auth"],
    body: {
        type: "object",
        required: ["firstName", "lastName", "email", "country", "accountType"],
        properties: {
            firstName: { type: "string" },
            lastName: { type: "string" },
            email: { type: "string", format: "email" },
            otherName: { type: "string" },
            country: { type: "string" },
            phoneNumber: { type: "string" },
            accountType: { type: "string", enum: ["investor", "business"] },
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