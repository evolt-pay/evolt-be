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