import mongoose from "mongoose";
import Asset from "./asset.model.js";
import { BusinessDoc } from "@business/business.model.js";
import { CorporateDoc } from "@corporate/corporate.model.js";


function ensureDiscriminator(modelName: string, schemaDef: any) {
    if (!Asset.discriminators?.[modelName]) {
        Asset.discriminator(modelName, new mongoose.Schema(schemaDef));
    }
}

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

export type FundingStatus = "funding" | "funded" | "fully_funded";

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
    fundedAmount?: number;
    fundingStatus?: FundingStatus;
    description: string;

    originatorId: mongoose.Types.ObjectId | BusinessDoc;
    corporateId?: mongoose.Types.ObjectId | CorporateDoc;
    userId?: mongoose.Types.ObjectId | CorporateDoc;
    metadata: any;
    blobUrl?: string;
    verifier?: string;
    tokenName: string;

    tokenId?: string;
    tokenEvm?: string;
    symbol: string,
    escrowContractId?: string;
    escrowEvm?: string;
    hcsTxId?: string;

    totalTarget?: number;
    minInvestment?: number;
    maxInvestment?: number;
    expiryDate?: Date;
    verifiedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

export default Asset;