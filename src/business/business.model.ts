import mongoose, { Schema, Document } from "mongoose";

export interface ISignatory {
    fullName: string;
    email: string;
    phoneNumber: string;
    idUrl?: string;
}

export interface IBusiness extends Document {
    userId: mongoose.Types.ObjectId;
    rcNumber: string;
    businessName: string;
    address: string;
    ownershipDocumentUrl: string;
    signatories: ISignatory[];
    description?: string;
    kybStatus: "pending" | "approved" | "rejected";
}

const BusinessSchema = new Schema<IBusiness>(
    {
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        rcNumber: String,
        businessName: String,
        address: String,
        ownershipDocumentUrl: String,
        signatories: [
            {
                fullName: String,
                email: String,
                phoneNumber: String,
                idUrl: String,
            },
        ],
        description: String,
        kybStatus: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
    },
    { timestamps: true }
);

export const BusinessModel = mongoose.model<IBusiness>("BusinessProfile", BusinessSchema);