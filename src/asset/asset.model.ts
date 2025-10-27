import mongoose from "mongoose";
import { AssetDoc } from "./asset.type";

const baseAssetSchema = new mongoose.Schema<AssetDoc>(
    {
        assetType: {
            type: String,
            enum: ["invoice", "agriculture", "real_estate", "creator_ip", "receivable"],
            required: true,
        },
        title: String,
        description: String,
        originatorId: { type: mongoose.Schema.Types.ObjectId, ref: "Business" },
        corporateId: { type: mongoose.Schema.Types.ObjectId, ref: "Corporate" },
        amount: { type: Number, required: true },
        currency: { type: String, default: "USD" },
        yieldRate: { type: Number, default: 0.1 },
        durationDays: { type: Number, required: true },
        totalTarget: Number,
        expiryDate: Date,
        status: { type: String, enum: ["pending", "verified", "tokenized"], default: "pending" },
        fundedAmount: { type: Number, default: 0 },
        fundingStatus: {
            type: String,
            enum: ["funding", "funded", "fully_funded"],
            default: "funding",
        },
        verifier: String,
        blobUrl: String,
        metadata: { type: Object, default: {} },
        tokenName: String,
        tokenId: String,
        tokenEvm: String,
        escrowContractId: String,
        escrowEvm: String,
        symbol: String,
        minInvestment: { type: Number, default: 10 },
        maxInvestment: Number,
    },
    { discriminatorKey: "assetType", timestamps: true }
);

export const AssetModel =
    mongoose.models.Asset || mongoose.model("Asset", baseAssetSchema);

function defineDiscriminator(name: string, schema: mongoose.Schema) {
    if (!AssetModel.discriminators || !AssetModel.discriminators[name]) {
        return AssetModel.discriminator(name, schema);
    }
    return AssetModel.discriminators[name];
}

export const InvoiceModel = defineDiscriminator(
    "invoice",
    new mongoose.Schema({
        invoiceNumber: String,
        dueDate: Date,
    })
);

export const AgricultureModel = defineDiscriminator(
    "agriculture",
    new mongoose.Schema({
        farmName: String,
        cropType: String,
        harvestDate: Date,
        expectedYield: Number,
    })
);

export const RealEstateModel = defineDiscriminator(
    "real_estate",
    new mongoose.Schema({
        propertyAddress: String,
        squareFeet: Number,
        appraisalValue: Number,
    })
);

export const CreatorIpModel = defineDiscriminator(
    "creator_ip",
    new mongoose.Schema({
        creatorName: String,
        ipCategory: String,
        licenseValue: Number,
    })
);

export const ReceivableModel = defineDiscriminator(
    "receivable",
    new mongoose.Schema({
        debtorName: String,
        dueDate: Date,
        receivableAmount: Number,
    })
);

export default AssetModel;