import { UserModel, IUser } from "./user.model";
import { FilterQuery } from "mongoose";

class UserService {
    async createPendingUser(data: Partial<IUser>): Promise<IUser> {
        const user = new UserModel(data);
        return user.save();
    }

    async fetchOneUser(query: FilterQuery<IUser>): Promise<IUser | null> {
        return UserModel.findOne(query).select("-password");
    }

    async fetchOneUserWithPassword(query: FilterQuery<IUser>): Promise<IUser | null> {
        return UserModel.findOne(query);
    }

    async getUserById(id: string): Promise<IUser | null> {
        return UserModel.findById(id).select("-password");
    }

    async getUserEmail(email: string): Promise<IUser | null> {
        return UserModel.findOne({ email } as FilterQuery<IUser>).select("-password");
    }

    async verifyOtp(email: string, otp: string): Promise<boolean> {
        const user = await UserModel.findOne({ email } as FilterQuery<IUser>);
        if (!user) throw new Error("User not found");

        const isValid = user.isOtpValid(otp);
        if (isValid) {
            user.otp = undefined;
            user.isVerified = true;
            user.onboardingStep = "otp_verified";
        } else {
            user.otpAttempts = (user.otpAttempts || 0) + 1;
            if ((user.otpAttempts || 0) >= 3) {
                user.otpBlockedUntil = new Date(Date.now() + 15 * 60 * 1000);
            }
        }

        await user.save();
        return isValid;
    }

    async savePersonalInfo(userId: string, data: Partial<IUser>): Promise<IUser | null> {
        return UserModel.findByIdAndUpdate(userId, data, { new: true }).select("-password");
    }

    async setPassword(userId: string, password: string): Promise<void> {
        const user = await UserModel.findById(userId);
        if (!user) throw new Error("User not found");

        user.password = password;
        user.passwordUpdatedAt = new Date();
        user.onboardingStep = "password_set";
        await user.save();
    }

    async updateUser(userId: string, data: Partial<IUser>): Promise<IUser | null> {
        return UserModel.findByIdAndUpdate(userId, data, { new: true }).select("-password");
    }
}

export default new UserService();