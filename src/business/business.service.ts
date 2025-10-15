import { BusinessModel, IBusiness } from "./business.model.js";
import { AzureUtil } from "../util/azure.util.js";
import { UserModel } from "../user/user.model.js";

class BusinessService {
    async uploadToAzure(buffer: Buffer, filename: string, mimetype?: string) {
        return AzureUtil.uploadFileFromBuffer(buffer, filename, "kyb-documents", mimetype);
    }

    async createBusinessProfile(
        userId: string,
        data: Partial<IBusiness>,
        ownershipFile: { buffer: Buffer; filename: string; mimetype?: string }
    ): Promise<IBusiness> {
        const ownershipUrl = await this.uploadToAzure(
            ownershipFile.buffer,
            `business/${userId}-${Date.now()}-${ownershipFile.filename}`,
            ownershipFile.mimetype
        );

        const payload = {
            ...data,
            ownershipDocumentUrl: ownershipUrl,
            kybStatus: "pending",
        };

        let profile = await BusinessModel.findOne({ userId });

        if (profile) {
            Object.assign(profile, payload);
            await profile.save();
        } else {
            profile = new BusinessModel({ ...payload, userId });
            await profile.save();
        }

        // Update onboarding step in User table
        await UserModel.findByIdAndUpdate(userId, {
            onboardingStep: "personal_saved",
            kycStatus: "pending",
        });

        return profile;
    }

    async getBusinessProfile(userId: string): Promise<IBusiness | null> {
        return BusinessModel.findOne({ userId });
    }

    async getBusinessById(businessId: string): Promise<IBusiness | null> {
        return BusinessModel.findById(businessId);
    }

    async updateKybStatus(userId: string, status: "pending" | "approved" | "rejected") {
        return BusinessModel.findOneAndUpdate({ userId }, { kybStatus: status }, { new: true });
    }
}

export default new BusinessService();