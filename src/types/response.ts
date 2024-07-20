import { Model } from "sequelize";

export type CustomerDetailResponse = {
    user: Model<any, any>,
    totalLoans: number,
    requestedLoans: number,
    rejectedLoans: number,
    activeLoans: number,
    completedLoans: number,
    totalLiability: number,
    totalPaid: number,
}