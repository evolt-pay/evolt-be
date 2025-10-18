import { InvestorModel, IInvestor } from "./investor.model.js";
import InvestmentModel from "../investment/investment.model.js";
import InvoiceModel from "../invoice/invoice.model.js";
import type { Investment } from "../investment/investment.type.js";
import type { InvestmentsPayload } from "../investment/investment.dto.js";

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);

type RawInv = {
    _id: any;
    investorId: string;
    tokenId: string;
    invoiceNumber?: string;
    vusdAmount: number;
    iTokenAmount?: number;
    yieldRate?: number;
    status?: "active" | "completed";
    createdAt: Date | string;
    maturedAt?: Date | string | null;
};

export class InvestorService {
    async addInvestor(accountId: string, extraData?: Partial<IInvestor>) {
        let investor = await InvestorModel.findOne({ accountId });
        if (!investor) {
            investor = new InvestorModel({ accountId, ...extraData });
        } else if (extraData) {
            Object.assign(investor, extraData);
        }
        await investor.save();
        return investor;
    }

    async getInvestorInvestments(accountId: string) {
        if (!accountId) throw new Error("Wallet address is required");
        const investor = await InvestorModel.findOne({ accountId });
        if (!investor) throw new Error("Investor not found");

        const investments = await InvestmentModel
            .find({ investorWallet: accountId })
            .sort({ createdAt: -1 })
            .lean();

        return { investor, investments };
    }


    async getInvestorPortfolio(accountId: string): Promise<InvestmentsPayload> {
        if (!accountId) throw new Error("Wallet address is required");

        const investor = await InvestorModel.findOne({ accountId }).lean();
        if (!investor) throw new Error("Investor not found");

        const myInvestments = await InvestmentModel
            .find({ investorId: String(investor._id) })
            .sort({ createdAt: -1 })
            .lean<RawInv[]>();

        if (myInvestments.length === 0) {
            return { pending: [], completed: [], totals: { tvlPending: 0, earningsToDatePending: 0 } };
        }

        type Acc = {
            tokenId: string;
            invoiceNumber?: string;
            createdAt: Date;
            maturedAt?: Date;
            status: "active" | "completed";
            totalVusd: number;
            totalIToken: number;
            anyYieldRate?: number;
            ids: string[];
        };

        const groups = new Map<string, Acc>();
        for (const inv of myInvestments) {
            const key = String(inv.tokenId);
            const created = new Date(inv.createdAt);
            const matured = inv.maturedAt ? new Date(inv.maturedAt as any) : undefined;

            const g = groups.get(key) ?? {
                tokenId: key,
                invoiceNumber: inv.invoiceNumber,
                createdAt: created,
                maturedAt: matured,
                status: inv.status ?? "active",
                totalVusd: 0,
                totalIToken: 0,
                anyYieldRate: inv.yieldRate,
                ids: [],
            };

            if (created < g.createdAt) g.createdAt = created;
            if (matured && (!g.maturedAt || matured > g.maturedAt)) g.maturedAt = matured;

            if (g.status !== "active" && inv.status === "active") g.status = "active";

            g.totalVusd += Number(inv.vusdAmount ?? 0);
            g.totalIToken += Number(inv.iTokenAmount ?? 0);
            if (inv.yieldRate != null) g.anyYieldRate = Number(inv.yieldRate);
            g.ids.push(String(inv._id));

            groups.set(key, g);
        }

        const tokenIds = [...groups.keys()];
        const invoices = await InvoiceModel
            .find({ tokenId: { $in: tokenIds } })
            .select("tokenId invoiceNumber businessName corporateName corporateLogo amount totalTarget yieldRate durationDays")
            .lean();

        const invoiceByToken = new Map<string, any>();
        for (const inv of invoices) invoiceByToken.set(String(inv.tokenId), inv);

        // For daily % and purchase price fallback, we might want total funded (all users)
        const fundedAgg = await InvestmentModel.aggregate([
            { $match: { tokenId: { $in: tokenIds } } },
            { $group: { _id: "$tokenId", funded: { $sum: "$vusdAmount" } } },
        ]);
        const fundedByToken = new Map<string, number>(
            fundedAgg.map((r: any) => [String(r._id), Number(r.funded || 0)])
        );

        const pending: Investment[] = [];
        const completed: Investment[] = [];

        for (const [tokenId, g] of groups.entries()) {
            const invoice = invoiceByToken.get(tokenId);
            const faceValue = Number(invoice?.amount ?? 0);          // invoice face value
            const configuredTarget = Number(invoice?.totalTarget ?? 0); // purchase price if set
            const configuredYield = Number(
                invoice?.yieldRate ?? g.anyYieldRate ?? 0
            ); // fraction 0..1

            let purchasePrice = 0;
            if (configuredTarget > 0) {
                purchasePrice = configuredTarget;
            } else if (faceValue > 0 && configuredYield > 0 && configuredYield < 1) {
                purchasePrice = faceValue * (1 - configuredYield);
            } else {
                purchasePrice = fundedByToken.get(tokenId) || 0;
            }

            // profit on invoice if we know it
            const profitTotal = Math.max(0, faceValue - purchasePrice);

            // expected yield for THIS investor (aggregated capital for this token)
            let expectedYield = 0;
            if (profitTotal > 0 && purchasePrice > 0) {
                expectedYield = (g.totalVusd / purchasePrice) * profitTotal;
            } else if (configuredYield > 0 && configuredYield < 1) {
                // discount-only fallback: share = capital * (y / (1 - y))
                expectedYield = g.totalVusd * (configuredYield / (1 - configuredYield));
            }

            const durationDays =
                Number(invoice?.durationDays ?? 0) ||
                (g.maturedAt
                    ? Math.max(1, Math.round((g.maturedAt.getTime() - g.createdAt.getTime()) / MS_PER_DAY))
                    : 90);

            const now = new Date();
            const elapsedDays = Math.max(0, Math.floor((now.getTime() - g.createdAt.getTime()) / MS_PER_DAY));
            const progress = (g.status === "completed" || (g.maturedAt && g.maturedAt <= now))
                ? 1
                : clamp01(elapsedDays / durationDays);

            const earningsToDate = Math.round((expectedYield * progress) * 1e6) / 1e6;
            const earningsPctToDate = Math.round(progress * 10000) / 100;

            const dailyPct =
                (purchasePrice > 0 && durationDays > 0)
                    ? ((profitTotal / purchasePrice) * 100) / durationDays
                    : (configuredYield > 0 && durationDays > 0)
                        ? ((configuredYield / (1 - configuredYield)) * 100) / durationDays
                        : 0;

            const expectedYield2dp = Math.round(expectedYield * 100) / 100;


            const investment: Investment = {
                id: tokenId,
                poolName: invoice?.corporateName ?? invoice?.businessName ?? "Investment Pool",
                subtitle: invoice?.businessName && invoice?.corporateName ? invoice.businessName : undefined,
                tokenId,
                invoiceId: invoice?._id ? String(invoice._id) : undefined,
                invoiceNumber: invoice?.invoiceNumber,
                logoUrl: invoice?.corporateLogo ?? null,

                vusdAmount: g.totalVusd,
                iTokenAmount: g.totalIToken,

                yieldRate: configuredYield,
                dailyPct,
                expectedYield: expectedYield2dp,
                earningsToDate,
                earningsPctToDate,

                createdAt: g.createdAt.toISOString(),
                maturedAt: g.maturedAt ? g.maturedAt.toISOString() : undefined,
                status: (g.maturedAt && g.maturedAt <= now) ? "completed" : g.status,
            };

            if (investment.status === "completed") completed.push(investment);
            else pending.push(investment);
        }

        const tvlPending = pending.reduce((s, x) => s + x.vusdAmount, 0);
        const earningsToDatePending = pending.reduce((s, x) => s + x.earningsToDate, 0);

        return {
            pending,
            completed,
            totals: { tvlPending, earningsToDatePending },
        };
    }

    async attachKycProof(accountId: string, proofCid: string, provider: string) {
        const investor = await InvestorModel.findOneAndUpdate(
            { accountId },
            { kycProofCid: proofCid, kycProvider: provider, approved: true },
            { new: true }
        );
        return investor;
    }
}

export default new InvestorService();