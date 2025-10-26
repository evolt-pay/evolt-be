import { PipelineStage } from "mongoose";
import AssetModel from "../asset/asset.model.js";
import InvestmentModel from "../investment/investment.model.js";
import { BusinessDoc, BusinessModel } from "../business/business.model.js";
import { CorporateDoc, CorporateModel } from "../corporate/corporate.model.js";
import assetService from "../asset/asset.service.js";
import { countTokenHolders } from "../util/util.hedera.js";
import { AssetDoc } from "asset/asset.type.js";

interface PoolListOptions {
    status?: "funding" | "funded" | "fully_funded" | "all";
    page?: number;
    limit?: number;
    search?: string;
}

class PoolService {

    async listPools({ status = "all", page = 1, limit = 20, search }: PoolListOptions) {
        const skip = (page - 1) * limit;

        const match: Record<string, any> = { tokenized: true };

        if (search) {
            match.$or = [
                { projectName: new RegExp(search, "i") },
                { "biz.businessName": new RegExp(search, "i") },
                { "corp.name": new RegExp(search, "i") },
            ];
        }

        const base: PipelineStage[] = [
            { $match: match },

            {
                $lookup: {
                    from: BusinessModel.collection.name,
                    localField: "originatorId",
                    foreignField: "_id",
                    as: "biz",
                },
            },
            { $unwind: { path: "$biz", preserveNullAndEmptyArrays: true } },

            {
                $lookup: {
                    from: CorporateModel.collection.name,
                    localField: "corporateId",
                    foreignField: "_id",
                    as: "corp",
                },
            },
            { $unwind: { path: "$corp", preserveNullAndEmptyArrays: true } },

            {
                $lookup: {
                    from: InvestmentModel.collection.name,
                    let: { tokenId: "$tokenId", tokenEvm: "$tokenEvm" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $or: [
                                        { $eq: ["$tokenId", "$$tokenId"] },
                                        { $eq: ["$tokenId", "$$tokenEvm"] },
                                    ],
                                },
                            },
                        },
                        { $group: { _id: null, funded: { $sum: "$vusdAmount" } } },
                    ],
                    as: "agg",
                },
            },

            {
                $addFields: {
                    businessName: "$biz.businessName",
                    corporateName: "$corp.name",
                    corporateLogo: { $ifNull: ["$corp.logoUrl", "$corp.logo"] },
                    fundedAmount: { $ifNull: [{ $arrayElemAt: ["$agg.funded", 0] }, 0] },
                    daysLeft: {
                        $max: [
                            0,
                            {
                                $ceil: {
                                    $divide: [
                                        { $subtract: ["$expiryDate", new Date()] },
                                        1000 * 60 * 60 * 24,
                                    ],
                                },
                            },
                        ],
                    },
                },
            },

            {
                $addFields: {
                    fundingProgress: {
                        $min: [
                            {
                                $multiply: [
                                    {
                                        $cond: [
                                            { $gt: ["$totalTarget", 0] },
                                            { $divide: ["$fundedAmount", "$totalTarget"] },
                                            0,
                                        ],
                                    },
                                    100,
                                ],
                            },
                            100,
                        ],
                    },
                },
            },

            {
                $addFields: {
                    derivedStatus: {
                        $switch: {
                            branches: [
                                {
                                    case: { $gte: ["$fundingProgress", 100] },
                                    then: "fully_funded",
                                },
                                {
                                    case: {
                                        $and: [
                                            { $gte: ["$fundingProgress", 1] },
                                            { $lt: ["$fundingProgress", 100] },
                                        ],
                                    },
                                    then: "funded",
                                },
                            ],
                            default: "funding",
                        },
                    },
                },
            },
        ];

        if (status !== "all") {
            base.push({ $match: { derivedStatus: status } });
        }

        const dataPipeline: PipelineStage[] = [
            ...base,
            {
                $project: {
                    _id: 1,
                    projectName: 1,
                    businessName: 1,
                    corporateName: 1,
                    corporateLogo: 1,
                    yieldRate: 1,
                    minInvestment: 1,
                    maxInvestment: 1,
                    totalTarget: 1,
                    fundedAmount: 1,
                    fundingProgress: { $round: ["$fundingProgress", 0] },
                    status: "$derivedStatus",
                    daysLeft: 1,
                    expiryDate: 1,
                    blobUrl: 1,
                    assetType: 1,
                    createdAt: 1,
                },
            },
            { $sort: { createdAt: -1 } },
            { $skip: skip },
            { $limit: limit },
        ];

        const countPipeline: PipelineStage[] = [...base, { $count: "total" }];

        const [items, countAgg] = await Promise.all([
            AssetModel.aggregate(dataPipeline),
            AssetModel.aggregate(countPipeline),
        ]);

        const total = countAgg[0]?.total ?? 0;

        return { page, limit, total, items };
    }


    async getPoolDetails(assetId: string) {
        const asset = (await assetService.getAssetById(assetId)) as AssetDoc;
        if (!asset) throw new Error("Asset not found");

        const aggPromise = InvestmentModel.aggregate([
            { $match: { tokenId: asset.tokenId } },
            {
                $group: {
                    _id: null,
                    totalInvestors: { $sum: 1 },
                    totalFunded: { $sum: "$vusdAmount" },
                },
            },
        ]);

        const exclude: string[] = [];
        if (asset.escrowContractId) exclude.push(asset.escrowContractId);
        if (process.env.HEDERA_OPERATOR_ID) exclude.push(process.env.HEDERA_OPERATOR_ID);

        const stakersPromise = asset.tokenId
            ? countTokenHolders(asset.tokenId, { excludeAccounts: exclude })
            : Promise.resolve(0);

        const [agg, stakerCountOnChain] = await Promise.all([
            aggPromise,
            stakersPromise,
        ]);

        const poolStats = agg[0] || { totalInvestors: 0, totalFunded: 0 };
        const totalFunded = poolStats.totalFunded ?? 0;
        const totalTarget = asset.totalTarget ?? 0;

        const fundingProgress =
            totalTarget > 0 ? Math.min((totalFunded / totalTarget) * 100, 100) : 0;

        let status: "funding" | "funded" | "fully_funded";
        if (fundingProgress >= 100) status = "fully_funded";
        else if (fundingProgress >= 1) status = "funded";
        else status = "funding";

        const remainingTarget = Math.max(totalTarget - totalFunded, 0);

        const baseMin = Number(asset.minInvestment ?? 0);
        const baseMax = Number(asset.maxInvestment ?? totalTarget);

        const minInvestment =
            remainingTarget < baseMin ? remainingTarget : baseMin;
        const maxInvestment = Math.min(baseMax, remainingTarget);

        const business = asset.originatorId as BusinessDoc;
        const corporate = asset.corporateId as CorporateDoc;

        return {
            tokenId: asset.tokenId || null,
            escrowContractId: asset.escrowContractId || null,
            _id: asset._id,
            assetType: asset.assetType,
            projectName: asset.title,
            businessName: business.businessName || "N/A",
            businessDescription: business?.description || "",
            corporateName: corporate?.name || "N/A",
            corporateLogo:
                (corporate as any)?.logoUrl ?? (corporate as any)?.logo ?? null,
            corporateDescription: corporate?.description || "",

            fundedAmount: totalFunded,
            totalInvestors: poolStats.totalInvestors,
            stakerCountOnChain,
            fundingProgress: Math.round(fundingProgress),
            status,

            yieldRate: asset.yieldRate,
            durationInDays: asset.durationDays || 90,
            minInvestment: Math.max(minInvestment, 0),
            maxInvestment: Math.max(maxInvestment, 0),
            totalTarget,
            expiryDate: asset.expiryDate,

            verifier: asset.verifier,
            verifiedAt: asset.verifiedAt,
            hcsTxId: asset.hcsTxId,
            blobUrl: asset.blobUrl,
        };
    }
}

export default new PoolService();