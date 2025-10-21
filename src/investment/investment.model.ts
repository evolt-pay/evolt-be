import mongoose, { Schema, Document } from "mongoose";

export type InvestmentStatus = "active" | "completed" | "cancelled";

export interface InvestmentDoc extends Document {
    investorId: string;
    investorEvm?: string;

    tokenId: string;
    tokenEvm?: string;
    assetId: string;
    assetRef?: mongoose.Types.ObjectId;
    assetType?: string;

    vusdAmount: number;
    iTokenAmount: number;
    yieldRate: number;
    expectedYield: number;

    contractIndex?: number;
    status: InvestmentStatus;
    txId?: string;
    depositTxId?: string;

    maturedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const investmentSchema = new Schema<InvestmentDoc>(
    {
        investorId: { type: String, required: true },
        investorEvm: { type: String },

        tokenId: { type: String, required: true },
        tokenEvm: { type: String },
        assetId: { type: String, required: true },
        assetRef: { type: Schema.Types.ObjectId, ref: "Asset" },
        assetType: { type: String },

        vusdAmount: { type: Number, required: true },
        iTokenAmount: { type: Number, required: true },
        yieldRate: { type: Number, default: 0.1 },
        expectedYield: { type: Number, default: 0 },

        contractIndex: { type: Number },
        status: {
            type: String,
            enum: ["active", "completed", "cancelled"],
            default: "active",
        },
        txId: { type: String },
        depositTxId: { type: String },

        maturedAt: { type: Date },
    },
    { timestamps: true }
);

investmentSchema.index({ investorId: 1 });
investmentSchema.index({ tokenId: 1 });
investmentSchema.index({ assetType: 1 });
investmentSchema.index({ assetRef: 1 });
investmentSchema.index({ assetId: 1 });

export default mongoose.model<InvestmentDoc>("Investment", investmentSchema);