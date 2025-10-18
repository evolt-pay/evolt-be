import mongoose, { Schema, Document } from "mongoose";

export interface InvestmentDoc extends Document {
    investorId: string;
    tokenId: string;
    invoiceNumber: string;
    vusdAmount: number;
    iTokenAmount: number;
    yieldRate: number;
    expectedYield: number;
    contractIndex?: number;
    status: "active" | "completed";
    txId?: string;
    maturedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const investmentSchema = new Schema<InvestmentDoc>(
    {
        investorId: { type: String, required: true },
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