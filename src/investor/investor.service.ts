import { InvestorModel, IInvestor } from "./investor.model.js";
import InvestmentModel from "../investment/investment.model.js";

class InvestorService {
    async connectWallet(walletAddress: string): Promise<IInvestor> {
        if (!walletAddress) throw new Error("Wallet address is required");

        let investor = await InvestorModel.findOne({ walletAddress });
        if (!investor) {
            investor = await InvestorModel.create({ walletAddress });
        }

        return investor;
    }

    async getInvestorInvestments(walletAddress: string) {
        if (!walletAddress) throw new Error("Wallet address is required");

        const investor = await InvestorModel.findOne({ walletAddress });
        if (!investor) throw new Error("Investor not found");

        const investments = await InvestmentModel.find({ investorWallet: walletAddress })
            .sort({ createdAt: -1 })
            .lean();

        return { investor, investments };
    }

    async attachKycProof(walletAddress: string, proofCid: string, provider: string) {
        const investor = await InvestorModel.findOneAndUpdate(
            { walletAddress },
            { kycProofCid: proofCid, kycProvider: provider, approved: true },
            { new: true }
        );
        return investor;
    }
}

export default new InvestorService();