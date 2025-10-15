import mongoose, { Schema, Document } from "mongoose";

export interface IInvestor extends Document {
    walletAddress: string;
    publicKey?: string;
    evmAddress?: string;
    network?: "hedera" | "evm";
    kycProofCid?: string;
    kycProvider?: string;
    approved?: boolean;
    joinedAt?: Date;
}

const InvestorSchema = new Schema<IInvestor>(
    {
        walletAddress: { type: String, required: true, unique: true },
        publicKey: { type: String },
        evmAddress: { type: String },
        network: { type: String, enum: ["hedera", "evm"], default: "hedera" },
        kycProofCid: { type: String },
        kycProvider: { type: String },
        approved: { type: Boolean, default: false },
        joinedAt: { type: Date, default: Date.now },
    },
    { timestamps: true }
);

export const InvestorModel = mongoose.model<IInvestor>("Investor", InvestorSchema);