import { FastifySchema } from "fastify";

export const CreateInvestorSchema: FastifySchema = {
    description: "Create or update investor onboarding (KYC) profile",
    tags: ["onboard"],
    summary: "Investor KYC onboarding",
    security: [{ bearerAuth: [] }],
    body: {
        type: "object",
        required: [
            "firstName",
            "lastName",
            "dateOfBirth",
            "meansOfId",
            "idDocumentUrl",
            "address",
            "city",
            "state",
            "lga",
            "phoneNumber"
        ],
        properties: {
            firstName: { type: "string" },
            lastName: { type: "string" },
            dateOfBirth: { type: "string" },
            meansOfId: { type: "string" },
            idDocumentUrl: { type: "string" },
            address: { type: "string" },
            city: { type: "string" },
            state: { type: "string" },
            lga: { type: "string" },
            phoneNumber: { type: "string" }
        },
    },
    response: {
        201: {
            description: "Investor profile created successfully",
            type: "object",
            properties: {
                success: { type: "boolean" },
                message: { type: "string" },
                data: { type: "object" },
            },
        },
    },
};