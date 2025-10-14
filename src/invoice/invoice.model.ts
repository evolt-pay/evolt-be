import mongoose, { Document, Schema } from "mongoose";

export interface InvoiceDoc extends Document {
    businessId: mongoose.Types.ObjectId;
    invoiceNumber: string;
    amount: number;
    currency?: string;
    status: "pending" | "verified" | "tokenized";
    verifier?: string;
    corporateName?: string;
    corporateEmail?: string;
    corporateDescription?: string;
    blobUrl?: string;
    tokenId?: string;
    tokenEvm?: string;
    escrowEvm?: string;       // ✅ Added
    initialSupply?: number;
    escrowContractId?: string;      // ✅ Added
    verifiedAt?: Date;
    hcsTxId?: string;
    tokenized?: boolean;
    apy: { type: Number, default: 0.1 },
    durationDays: { type: Number, default: 90 },
    minInvestment: { type: Number, default: 100 },
    maxInvestment: { type: Number, default: 10000 },
    totalTarget: { type: Number, default: 100000 },
    expiryDate: { type: Date },
    createdAt?: Date;
    updatedAt?: Date;
}

const InvoiceSchema = new Schema<InvoiceDoc>(
    {
        businessId: { type: Schema.Types.ObjectId, ref: "Business", required: false },
        invoiceNumber: { type: String, required: true },
        amount: { type: Number, required: true },
        currency: { type: String, default: "USD" },
        status: {
            type: String,
            enum: ["pending", "verified", "tokenized"],
            default: "pending",
        },
        verifier: { type: String },
        corporateName: { type: String },
        corporateEmail: { type: String },
        corporateDescription: { type: String },
        blobUrl: { type: String },

        // ✅ Tokenization fields
        tokenId: { type: String },
        tokenEvm: { type: String },
        initialSupply: { type: Number },
        escrowContractId: { type: String }, // contract holding iTokens
        escrowEvm: { type: String },
        verifiedAt: { type: Date },
        hcsTxId: { type: String },
        tokenized: { type: Boolean, default: false },
        apy: { type: Number, default: 0.1 },
        durationDays: { type: Number, default: 90 },
        minInvestment: { type: Number, default: 100 },
        maxInvestment: { type: Number, default: 10000 },
        totalTarget: { type: Number, default: 100000 },
        expiryDate: { type: Date },
    },
    { timestamps: true }
);

export default mongoose.model<InvoiceDoc>("Invoice", InvoiceSchema);