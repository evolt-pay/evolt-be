import { Investment } from "./investment.type.js";

export type InvestmentsPayload = {
    pending: Investment[];
    completed: Investment[];
    totals: {
        tvlPending: number;
        earningsToDatePending: number;
    };
};