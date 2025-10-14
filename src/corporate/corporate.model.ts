import mongoose, { Document, Schema } from "mongoose";

export interface CorporateDoc extends Document {
    name: string;
    email: string;
    phone?: string;
    contactPerson?: string;
    verified: boolean;
    description?: string;
    logoUrl?: string;
    createdAt: Date;
    updatedAt: Date;
}

const CorporateSchema = new Schema<CorporateDoc>(
    {
        name: { type: String, required: true, unique: true },
        email: { type: String, required: true },
        phone: String,
        contactPerson: String,
        description: String,
        logoUrl: String,
        verified: { type: Boolean, default: true },
    },
    { timestamps: true }
);

export const CorporateModel = mongoose.model<CorporateDoc>("Corporate", CorporateSchema);