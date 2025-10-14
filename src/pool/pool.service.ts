import { PipelineStage } from "mongoose";
import InvoiceModel from "../invoice/invoice.model.js";
import InvestmentModel from "../investment/investment.model.js";
import { BusinessModel } from "../onboard/business/business.model.js";
import businessService from "../onboard/business/business.service.js";
import invoiceService from "../invoice/invoice.service.js";

interface PoolListOptions {
    status?: "funding" | "funded" | "fully_funded" | "all";
    page?: number;
    limit?: number;
    search?: string;
}

class PoolService {
    async listPools({
        status = "all",
        page = 1,
        limit = 20,
        search,
    }: PoolListOptions) {
        const skip = (page - 1) * limit;
        const match: Record<string, any> = { tokenized: true };

        if (search) {
            match.$or = [
                { projectName: new RegExp(search, "i") },
                { businessName: new RegExp(search, "i") },
            ];
        }

        const pipeline: PipelineStage[] = [
            { $match: match },
            {
                $lookup: {
                    from: BusinessModel.collection.name,
                    localField: "businessId",
                    foreignField: "_id",
                    as: "biz",
                },
            },
            { $unwind: { path: "$biz", preserveNullAndEmptyArrays: true } },
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
                    fundedAmount: { $ifNull: [{ $arrayElemAt: ["$agg.funded", 0] }, 0] },
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
            {
                $project: {
                    _id: 1,
                    projectName: 1,
                    businessName: 1,
                    apy: 1,
                    minInvestment: 1,
                    maxInvestment: 1,
                    totalTarget: 1,
                    fundedAmount: 1,
                    fundingProgress: { $round: ["$fundingProgress", 0] },
                    status: "$derivedStatus",
                    daysLeft: 1,
                    expiryDate: 1,
                    blobUrl: 1,
                },
            },
            { $sort: { createdAt: -1 } },
            { $skip: skip },
            { $limit: limit },
        ];

        if (status !== "all") {
            pipeline.splice(6, 0, { $match: { derivedStatus: status } });
        }

        const [items, totalCount] = await Promise.all([
            InvoiceModel.aggregate(pipeline),
            InvoiceModel.countDocuments(match),
        ]);

        return { page, limit, total: totalCount, items };
    }

    async getPoolDetails(invoiceId: string) {
        const invoice = await invoiceService.getInvoiceById(invoiceId)
        if (!invoice) throw new Error("Invoice not found");

        const business = await businessService.getBusinessByd(invoice?.businessId!.toString());

        const agg = await InvestmentModel.aggregate([
            { $match: { tokenId: invoice.tokenId } },
            {
                $group: {
                    _id: null,
                    totalInvestors: { $sum: 1 },
                    totalFunded: { $sum: "$vusdAmount" },
                },
            },
        ]);

        const poolStats = agg[0] || { totalInvestors: 0, totalFunded: 0 };

        return {
            invoiceNumber: invoice.invoiceNumber,
            businessName: business?.businessName || "N/A",
            businessDescription: business?.description || "",
            corporateName: invoice.corporateName,
            corporateDescription: invoice.corporateDescription,
            fundedAmount: poolStats.totalFunded,
            totalInvestors: poolStats.totalInvestors,
            apy: invoice.apy,
            durationInDays: invoice.durationDays || 90,
            verifier: invoice.verifier,
            verifiedAt: invoice.verifiedAt,
            hcsTxId: invoice.hcsTxId,
            blobUrl: invoice.blobUrl,
        };
    }
}

export default new PoolService();