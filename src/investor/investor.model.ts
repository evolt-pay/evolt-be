import mongoose, { Schema, Document } from "mongoose";

export interface IInvestor extends Document {
    walletAddress: string;
    kycProofCid?: string;
    kycProvider?: string;
    approved?: boolean;
    joinedAt?: Date;
}

const InvestorSchema = new Schema<IInvestor>(
    {
        walletAddress: { type: String, required: true, unique: true },
        kycProofCid: String,
        kycProvider: String,
        approved: { type: Boolean, default: false },
        joinedAt: { type: Date, default: Date.now },
    },
    { timestamps: true }
);

export const InvestorModel = mongoose.model<IInvestor>("Investor", InvestorSchema);