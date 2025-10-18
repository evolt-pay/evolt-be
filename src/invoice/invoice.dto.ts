import { Types } from "mongoose";

type BusinessSlim = {
    _id: Types.ObjectId | string;
    businessName: string;
    description?: string;
    logoUrl?: string;
};

type CorporateSlim = {
    _id: Types.ObjectId | string;
    name: string;
    description?: string;
    logoUrl?: string;
};

export interface InvoiceDto {
    _id: string;
    invoiceNumber: string;
    amount: number;
    currency?: string;

    yieldRate?: number;
    durationDays?: number;
    minInvestment?: number;
    maxInvestment?: number;
    totalTarget?: number;
    expiryDate?: Date;

    // tokenization
    status: "pending" | "verified" | "tokenized";
    tokenId?: string;
    tokenEvm?: string;
    escrowEvm?: string;
    escrowContractId?: string;
    initialSupply?: number;
    tokenized?: boolean;
    verifier?: string;
    verifiedAt?: Date;
    hcsTxId?: string;

    blobUrl?: string;

    // shaped relations
    business: BusinessSlim | null;
    corporate: CorporateSlim | null;
}

