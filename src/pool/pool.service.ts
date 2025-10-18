import { PipelineStage } from "mongoose";
import InvoiceModel from "../invoice/invoice.model.js";
import InvestmentModel from "../investment/investment.model.js";
import { BusinessModel } from "../business/business.model.js";
import { CorporateModel } from "../corporate/corporate.model.js";
import invoiceService from "../invoice/invoice.service.js";
import { countTokenHolders } from "../util/util.hedera.js";

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

            // 1) Join Business
            {
                $lookup: {
                    from: BusinessModel.collection.name,
                    localField: "businessId",
                    foreignField: "_id",
                    as: "biz",
                },
            },
            { $unwind: { path: "$biz", preserveNullAndEmptyArrays: true } },

            // 2) Join Corporate
            {
                $lookup: {
                    from: CorporateModel.collection.name,
                    localField: "corporateId",
                    foreignField: "_id",
                    as: "corp",
                },
            },
            { $unwind: { path: "$corp", preserveNullAndEmptyArrays: true } },

            // 3) Funded amount aggregate
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

            // 4) Derived fields incl. business/corporate + daysLeft
            {
                $addFields: {
                    businessName: "$biz.businessName",
                    corporateName: "$corp.name",
                    // 👇 if your field is `logo` instead of `logoUrl`, swap order
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

            // 5) fundingProgress
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

            // 6) derivedStatus
            {
                $addFields: {
                    derivedStatus: {
                        $switch: {
                            branches: [
                                { case: { $gte: ["$fundingProgress", 100] }, then: "fully_funded" },
                                { case: { $gt: ["$fundedAmount", 0] }, then: "funded" },
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
                    createdAt: 1,
                },
            },
            { $sort: { createdAt: -1 } },
            { $skip: skip },
            { $limit: limit },
        ];

        const countPipeline: PipelineStage[] = [...base, { $count: "total" }];

        const [items, countAgg] = await Promise.all([
            InvoiceModel.aggregate(dataPipeline),
            InvoiceModel.aggregate(countPipeline),
        ]);

        const total = countAgg[0]?.total ?? 0;

        return { page, limit, total, items };
    }


    async getPoolDetails(invoiceId: string) {
        const invoice = await invoiceService.getInvoiceById(invoiceId);
        if (!invoice) throw new Error("Invoice not found");

        const aggPromise = InvestmentModel.aggregate([
            { $match: { tokenId: invoice.tokenId } },
            { $group: { _id: null, totalInvestors: { $sum: 1 }, totalFunded: { $sum: "$vusdAmount" } } },
        ]);

        const exclude: string[] = [];
        if (invoice.escrowContractId) exclude.push(invoice.escrowContractId);
        if (process.env.HEDERA_OPERATOR_ID) exclude.push(process.env.HEDERA_OPERATOR_ID);

        const stakersPromise = invoice.tokenId
            ? countTokenHolders(invoice.tokenId, { excludeAccounts: exclude })
            : Promise.resolve(0);

        const [agg, stakerCountOnChain] = await Promise.all([aggPromise, stakersPromise]);
        const poolStats = agg[0] || { totalInvestors: 0, totalFunded: 0 };

        return {
            tokenId: invoice.tokenId || null,
            escrowContractId: invoice.escrowContractId || null,
            _id: invoice._id,
            invoiceNumber: invoice.invoiceNumber,
            businessName: invoice?.business?.businessName || "N/A",
            businessDescription: invoice.business?.description || "",
            corporateName: invoice.corporate?.name || "N/A",
            corporateLogo: (invoice.corporate as any)?.logoUrl ?? (invoice.corporate as any)?.logo ?? null,
            corporateDescription: invoice.corporate?.description || "",

            fundedAmount: poolStats.totalFunded,
            totalInvestors: poolStats.totalInvestors,
            stakerCountOnChain,

            yieldRate: invoice.yieldRate,
            durationInDays: invoice.durationDays || 90,
            minInvestment: invoice.minInvestment ?? 0,
            maxInvestment: invoice.maxInvestment ?? 0,
            totalTarget: invoice.totalTarget ?? 0,
            expiryDate: invoice.expiryDate,

            verifier: invoice.verifier,
            verifiedAt: invoice.verifiedAt,
            hcsTxId: invoice.hcsTxId,
            blobUrl: invoice.blobUrl,
        };
    }
}

export default new PoolService();