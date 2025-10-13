import mongoose, { Schema, Document } from "mongoose";

export interface IInvestor extends Document {
    userId: mongoose.Types.ObjectId;
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    meansOfId: string;
    idDocumentUrl: string;
    address: string;
    city: string;
    state: string;
    lga: string;
    phoneNumber: string;
    kycStatus: "pending" | "approved" | "rejected";
}

const InvestorSchema = new Schema<IInvestor>(
    {
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        firstName: String,
        lastName: String,
        dateOfBirth: String,
        meansOfId: String,
        idDocumentUrl: String,
        address: String,
        city: String,
        state: String,
        lga: String,
        phoneNumber: String,
        kycStatus: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
    },
    { timestamps: true }
);

export const InvestorModel = mongoose.model<IInvestor>("InvestorProfile", InvestorSchema);