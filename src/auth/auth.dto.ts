export interface ISendOtp {
    email: string;
}

export interface ISignup {
    firstName?: string;
    lastName?: string;
    email: string;
    password?: string;
    phoneNumber?: string;
    country?: string;
    accountType: "investor" | "business";
}

export interface IVerifyOtp {
    email: string;
    otp: string;
}

export interface ISetPassword {
    password: string;
}

export interface ILogin {
    email: string;
    password: string;
}