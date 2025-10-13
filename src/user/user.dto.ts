import mongoose from "mongoose";

export interface CreateUserDTO {
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber?: string;
    password: string;
}

export interface Otp {
    code: string;
    expiresAt: Date;
    purpose: "emailVerification" | "passwordReset" | "loginVerification";
}

export enum UserRole {
    USER = "user",
    ADMIN = "admin",
    INVESTOR = "investor",
    BUSINESS = "business",
}

export interface LoginDTO {
    email: string;
    password: string;
}

export interface UpdateUserDTO {
    firstName?: string;
    lastName?: string;
    phoneNumber?: string;
}

export interface ChangePasswordDTO {
    oldPassword: string;
    newPassword: string;
}

export interface UpdateRoleDTO {
    role: UserRole;
}



export interface UpdateDepositAddressesDTO {
    usdc?: string;
    usdt?: string;
}

export interface AddCardDTO {
    cardNumber: string;
    expiry: string;
    cvv: string;
    provider: "visa" | "mastercard" | "virtual";
}

export interface Provider {
    provider: "bridge" | "circle" | "stripe";
    customerId?: string;
    status?: "pending" | "created" | "failed";
    errorMessage?: string | null;
    lastAttempt?: Date | null;
    signedAgreementId?: string;
    createdAt?: Date | null;
}

export interface EmploymentInfo {
    employmentStatus: string;
    occupation: string;
    occupationOther: string;
    employerName: string;
    industry: string;
    accountPurpose: string;
    accountPurposeOther: string;
    sourceOfFunds: string;
    expectedMonthlyPayments: string;
    fundsFor: string;
    fundsForOther: string;
    estimatedAnnualIncome: string;
    netWorthRange: string;
    lastUpdated: Date
}

export interface Address {
    houseAddress?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country: string;
}
export interface Card {
    cardNumber: string;
    expiry: string;
    cvv: string;
    provider: "visa" | "mastercard" | "virtual";
    balance: number;
}
export interface UserDoc extends Document {
    firstName: string;
    lastName: string;
    otherName?: string;
    email: string;
    dob?: string;
    phoneNumber?: string;
    password: string;
    businesses?: mongoose.Types.ObjectId[];
    isVerified: boolean;
    employmentInfo: EmploymentInfo;
    role: UserRole;
    address?: Address,
    otp?: Otp;
    otpAttempts: number;
    otpBlockedUntil?: Date;
    stablecoinBalance: number;
    depositAddresses: {
        usdc?: string;
        usdt?: string;
    };
    cards: Card[];
    passwordUpdatedAt: Date;
    providers: Provider[];
    comparePassword(password: string): Promise<boolean>;
    isOtpValid(otpCode: string): boolean;
    isOtpBlocked(): boolean;
}