import mongoose, { Schema, Document } from "mongoose";

export interface InvestmentDoc extends Document {
    investorId: string;            // Hedera Account ID (e.g., 0.0.12345)
    investorEmail: string;         // Investor email for notifications
    tokenId: string;               // iToken (Invoice token)
    invoiceNumber: string;         // Invoice reference
    vusdAmount: number;            // Amount invested in vUSD
    iTokenAmount: number;          // iTokens received
    yieldRate: number;             // e.g. 0.1 for 10%
    expectedYield: number;         // Calculated yield (vUSD)
    contractIndex?: number;
    status: "active" | "completed";
    txId?: string;                 // Hedera tx for iToken delivery
    maturedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const investmentSchema = new Schema<InvestmentDoc>(
    {
        investorId: { type: String, required: true },
        investorEmail: { type: String },
        tokenId: { type: String, required: true },
        invoiceNumber: { type: String, required: true },
        vusdAmount: { type: Number, required: true },
        iTokenAmount: { type: Number, required: true },
        yieldRate: { type: Number, default: 0.1 },
        expectedYield: { type: Number, default: 0 },
        status: { type: String, enum: ["active", "completed"], default: "active" },
        txId: { type: String },
        maturedAt: { type: Date },
    },
    { timestamps: true }
);

investmentSchema.index({ investorId: 1 });
investmentSchema.index({ tokenId: 1 });

const InvestmentModel = mongoose.model<InvestmentDoc>("Investment", investmentSchema);
export default InvestmentModel;