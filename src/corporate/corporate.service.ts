import { CorporateModel, CorporateDoc } from "./corporate.model.js";

class CorporateService {
    async createCorporate(data: Partial<CorporateDoc>) {
        const existing = await CorporateModel.findOne({ name: data.name });
        if (existing) throw new Error("Corporate already exists");
        return await CorporateModel.create(data);
    }

    async getAllCorporates() {
        return await CorporateModel.find().sort({ createdAt: -1 }).lean();
    }

    async getCorporateById(id: string) {
        const corp = await CorporateModel.findById(id).lean();
        if (!corp) throw new Error("Corporate not found");
        return corp;
    }

    async updateCorporate(id: string, data: Partial<CorporateDoc>) {
        const corp = await CorporateModel.findByIdAndUpdate(id, data, { new: true });
        if (!corp) throw new Error("Corporate not found");
        return corp;
    }

    async deleteCorporate(id: string) {
        const deleted = await CorporateModel.findByIdAndDelete(id);
        if (!deleted) throw new Error("Corporate not found");
        return { success: true };
    }
}

export default new CorporateService();