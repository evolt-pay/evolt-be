export type Investment = {
    id: string;
    poolName: string;
    subtitle?: string;
    tokenId: string;
    invoiceId?: string;
    invoiceNumber?: string;
    logoUrl?: string | null;

    vusdAmount: number;
    iTokenAmount?: number;

    yieldRate: number;
    dailyPct: number;
    expectedYield: number;
    earningsToDate: number;
    earningsPctToDate: number;

    createdAt: string;
    maturedAt?: string;
    status: "active" | "completed";
};
