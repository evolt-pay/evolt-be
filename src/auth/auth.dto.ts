export interface ISendOtp {
    email: string;
}

export interface ISendSignupOtp {
    firstName: string;
    lastName: string;
    otherName?: string;
    country: string;
    email: string;
    phoneNumber?: string;
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