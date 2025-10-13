import { InvestorModel, IInvestor } from "./investor.model.js";
import { AzureUtil } from "../../util/azure.util.js";
import { UserModel } from "../../user/user.model.js";

class InvestorService {
    async onboardInvestor(
        userId: string,
        data: Partial<IInvestor>,
        file?: { buffer: Buffer; filename: string; mimetype?: string }
    ): Promise<IInvestor> {
        let documentUrl: string | undefined;

        if (file) {
            const fileName = `investors/${userId}-${Date.now()}-${file.filename.replace(/\s+/g, "_")}`;
            documentUrl = await AzureUtil.uploadFileFromBuffer(file.buffer, fileName, "kyc-documents", file.mimetype);
        }

        const updatePayload = {
            ...data,
            kycDocumentUrl: documentUrl,
            kycStatus: "pending",
        };

        const investor = await InvestorModel.findOneAndUpdate(
            { userId },
            { $set: updatePayload },
            { new: true, upsert: true }
        );

        await UserModel.findByIdAndUpdate(userId, {
            onboardingStep: "personal_saved",
            kycStatus: "pending",
        });

        return investor;
    }
}

export default new InvestorService();