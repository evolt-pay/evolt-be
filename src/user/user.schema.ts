import { FastifySchema } from "fastify";


const AddressSchema = {
    type: "object",
    nullable: true,
    properties: {
        houseAddress: { type: "string", nullable: true },
        city: { type: "string", nullable: true },
        state: { type: "string", nullable: true },
        postalCode: { type: "string", nullable: true },
        country: { type: "string", nullable: true },
    }
};


const KycDetailsSchema = {
    type: "object",
    nullable: true,
    properties: {
        status: { type: "string" },
        level: { type: "string" },
        provider: { type: "string", nullable: true },
        referenceId: { type: "string", nullable: true },
        lastUpdated: { type: "string", format: "date-time" },
        rejectionReason: { type: "string", nullable: true }
    }
};


const ProviderAccountSchema = {
    type: "object",
    properties: {
        provider: { type: "string", enum: ["bridge", "circle", "stripe"] },
        customerId: { type: "string", nullable: true },
        status: { type: "string", enum: ["pending", "created", "failed"] },
        errorMessage: { type: "string", nullable: true },
        lastAttempt: { type: "string", format: "date-time", nullable: true },
        signedAgreementId: { type: "string", nullable: true },
        createdAt: { type: "string", format: "date-time", nullable: true },
    }
};

export const UserResponseSchema = {
    type: "object",
    properties: {
        _id: { type: "string" },
        firstName: { type: "string" },
        lastName: { type: "string" },
        otherName: { type: "string", nullable: true },
        email: { type: "string" },
        phoneNumber: { type: "string", nullable: true },
        isVerified: { type: "boolean" },
        role: { type: "string", enum: ["user", "admin"] },
        kycDetails: KycDetailsSchema,
        address: AddressSchema,
        providers: { type: "array", items: ProviderAccountSchema },
        createdAt: { type: "string", format: "date-time" },
        updatedAt: { type: "string", format: "date-time" }
    }
};


const ActivitySchema = {
    type: "object",
    properties: {
        _id: { type: "string" },
        userId: { type: "string" },
        type: { type: "string", description: "e.g., transaction, login, update" },
        description: { type: "string" },
        metadata: { type: "object", additionalProperties: true }, // flexible field
        createdAt: { type: "string", format: "date-time" }
    }
};


export const GetProfileSchema: FastifySchema = {
    description: "Get logged-in user profile",
    tags: ["user"],
    security: [{ bearerAuth: [] }],
    response: {
        200: {
            type: "object",
            properties: {
                success: { type: "boolean" },
                message: { type: "string" },
                data: UserResponseSchema
            }
        }
    }
};


export const UpdateProfileSchema: FastifySchema = {
    description: "Update logged-in user profile",
    tags: ["user"],
    security: [{ bearerAuth: [] }],
    body: {
        type: "object",
        properties: {
            firstName: { type: "string" },
            lastName: { type: "string" },
            otherName: { type: "string" },
            country: { type: "string" },
            phone: { type: "string" }
        }
    },
    response: {
        200: {
            type: "object",
            properties: {
                success: { type: "boolean" },
                message: { type: "string" },
                data: UserResponseSchema
            }
        }
    }
};


export const GetActivitiesSchema: FastifySchema = {
    description: "Fetch user activities (transactions, logins, actions)",
    tags: ["user"],
    security: [{ bearerAuth: [] }],
    response: {
        200: {
            type: "object",
            properties: {
                success: { type: "boolean" },
                message: { type: "string" },
                data: { type: "array", items: ActivitySchema }
            }
        }
    }
};