import mongoose, { Document, Schema } from "mongoose";
import bcrypt from "bcrypt";

export interface IOtp {
    code: string;
    expiresAt: Date;
    purpose: "emailVerification" | "passwordReset" | "loginVerification";
}

export interface IUser extends Document {
    firstName?: string;
    lastName?: string;
    otherName?: string;
    email: string;
    phoneNumber?: string;
    password?: string;
    accountType: "investor" | "business";
    isVerified: boolean;
    hederaAccountId?: string;
    hederaEvm?: string;
    onboardingStep?: "otp_sent" | "otp_verified" | "personal_saved" | "password_set" | "wallet_linked";
    kycStatus?: "none" | "pending" | "approved" | "rejected";
    address?: {
        country?: string;
        state?: string;
        city?: string;
        houseAddress?: string;
    };
    otp?: IOtp;
    otpAttempts?: number;
    otpBlockedUntil?: Date;
    role: "user" | "admin" | "investor" | "business";
    passwordUpdatedAt: Date;

    comparePassword(password: string): Promise<boolean>;
    isOtpValid(otp: string): boolean;
}

const OtpSchema = new Schema<IOtp>(
    {
        code: { type: String, required: true },
        expiresAt: { type: Date, required: true },
        purpose: {
            type: String,
            enum: ["emailVerification", "passwordReset", "loginVerification"],
            required: true,
        },
    },
    { _id: false }
);

const UserSchema = new Schema<IUser>(
    {
        firstName: String,
        lastName: String,
        otherName: String,
        email: { type: String, required: true, unique: true, lowercase: true },
        phoneNumber: String,
        password: String,
        accountType: { type: String, enum: ["investor", "business"], default: "investor" },
        isVerified: { type: Boolean, default: false },
        hederaAccountId: String,
        hederaEvm: String,
        onboardingStep: {
            type: String,
            enum: ["otp_sent", "otp_verified", "personal_saved", "password_set", "wallet_linked"],
            default: "otp_sent",
        },
        kycStatus: {
            type: String,
            enum: ["none", "pending", "approved", "rejected"],
            default: "none",
        },
        address: {
            country: String,
            state: String,
            city: String,
            houseAddress: String,
        },
        otp: OtpSchema,
        otpAttempts: { type: Number, default: 0 },
        otpBlockedUntil: Date,
        role: { type: String, enum: ["user", "admin", "investor", "business"], default: "investor" },
        passwordUpdatedAt: { type: Date, default: Date.now },
    },
    { timestamps: true }
);

UserSchema.pre<IUser>("save", async function (next) {
    if (this.isModified("password")) {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password!, salt);
    }
    next();
});

UserSchema.methods.comparePassword = async function (password: string): Promise<boolean> {
    if (!this.password) return false;
    return bcrypt.compare(password, this.password);
};

UserSchema.methods.isOtpValid = function (otpCode: string): boolean {
    if (!this.otp) return false;
    if (this.otpBlockedUntil && this.otpBlockedUntil > new Date()) return false;
    return this.otp.code === otpCode && this.otp.expiresAt > new Date();
};

export const UserModel = mongoose.model<IUser>("User", UserSchema);