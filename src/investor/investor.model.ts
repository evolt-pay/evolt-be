import mongoose, { Schema, Document } from "mongoose";

export interface IInvestor extends Document {
    accountId?: string;
    alias?: string;
    publicKey?: string;
    evmAddress?: string;
    kycProofCid?: string;
    kycProvider?: string;
    approved?: boolean;
    joinedAt?: Date;
    phoneNumber?: string
}

const InvestorSchema = new Schema<IInvestor>(
    {
        alias: { type: String, unique: true },
        accountId: { type: String, unique: false },
        publicKey: { type: String },
        evmAddress: { type: String },
        kycProofCid: { type: String },
        kycProvider: { type: String },
        approved: { type: Boolean, default: false },
        joinedAt: { type: Date, default: Date.now },
        phoneNumber: { type: String }
    },
    { timestamps: true }
);

export const InvestorModel = mongoose.model<IInvestor>("Investor", InvestorSchema);