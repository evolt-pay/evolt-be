import mongoose from "mongoose";
import Asset from "./asset.model.js";
import { BusinessDoc } from "@business/business.model.js";
import { CorporateDoc } from "@corporate/corporate.model.js";

/**
 * ✅ Ensure discriminators are only registered once.
 *    Mongoose will throw an error if we try to redefine them.
 */
function ensureDiscriminator(modelName: string, schemaDef: any) {
    if (!Asset.discriminators?.[modelName]) {
        Asset.discriminator(modelName, new mongoose.Schema(schemaDef));
    }
}

// Register discriminators safely
ensureDiscriminator("invoice", {
    invoiceNumber: String,
    dueDate: Date,
});

ensureDiscriminator("agriculture", {
    farmName: String,
    cropType: String,
    harvestDate: Date,
    expectedYield: Number,
});

ensureDiscriminator("real_estate", {
    propertyAddress: String,
    squareFeet: Number,
    appraisalValue: Number,
});

export type AssetStatus = "pending" | "verified" | "tokenized";

export type AssetType =
    | "invoice"
    | "agriculture"
    | "real_estate"
    | "creator_ip"
    | "receivable";

export const ASSET_TYPES: AssetType[] = [
    "invoice",
    "agriculture",
    "real_estate",
    "creator_ip",
    "receivable",
];

export interface AssetDoc extends Document {
    _id: mongoose.Types.ObjectId;
    assetType: AssetType;
    amount: number;
    currency: string;
    yieldRate: number;
    durationDays: number;
    status: AssetStatus;
    description: string;

    originatorId: mongoose.Types.ObjectId | BusinessDoc;
    corporateId?: mongoose.Types.ObjectId | CorporateDoc;
    metadata: any;
    blobUrl?: string;
    verifier?: string;
    tokenName: string;

    tokenId?: string; // e.g. "0.0.12345"
    tokenEvm?: string; // e.g. "0xabc..."
    escrowContractId?: string;
    escrowEvm?: string;
    hcsTxId?: string; // Hedera Consensus Service Tx ID

    totalTarget?: number; // total fundraising goal
    minInvestment?: number; // min investor contribution
    maxInvestment?: number; // max investor contribution

    expiryDate?: Date;
    verifiedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

export default Asset;