import { BusinessModel, BusinessDoc } from "./business.model.js";
import { AzureUtil } from "../util/azure.util.js";
import { UserModel } from "../user/user.model.js";

class BusinessService {
    async uploadToAzure(buffer: Buffer, filename: string, mimetype?: string) {
        return AzureUtil.uploadFileFromBuffer(buffer, filename, "kyb-documents", mimetype);
    }

    async createBusinessProfile(
        userId: string,
        data: Partial<BusinessDoc>,
        ownershipFile: { buffer: Buffer; filename: string; mimetype?: string }
    ): Promise<BusinessDoc> {
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

        let business = await BusinessModel.findOne({ userId });

        if (business) {
            Object.assign(business, payload);
            await business.save();
        } else {
            business = new BusinessModel({ ...payload, userId });
            await business.save();
        }

        await UserModel.findByIdAndUpdate(userId, {
            onboardingStep: "personal_saved",
            kycStatus: "pending",
        });

        return business;
    }

    async getBusiness(userId: string): Promise<BusinessDoc | null> {
        return BusinessModel.findOne({ userId });
    }

    async getBusinessById(businessId: string): Promise<BusinessDoc | null> {
        return BusinessModel.findById(businessId);
    }

    async updateKybStatus(userId: string, status: "pending" | "approved" | "rejected") {
        return BusinessModel.findOneAndUpdate({ userId }, { kybStatus: status }, { new: true });
    }
}

export default new BusinessService();