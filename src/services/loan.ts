import { Model } from "sequelize";
import { LoanStatus, LoanTermType } from "../enums/loan";
import { LoanCreationRequest, LoanRepaymentRequest, LoanVerificationRequest } from "../types/loan";
import LoanDB from "../utils/dbUtils/loanDbUtil";

export default class LoanService {

    private loanDb: LoanDB

    constructor(loanDb: LoanDB) {
        this.loanDb = loanDb;
    }

    public async getAllLoans(forceFilter: any): Promise<Model<any, any>[]> {
        if (!forceFilter) forceFilter = {};
        return await this.loanDb.getAllLoans(forceFilter)
    }

    public async getLoanInfo(loanId: string): Promise<Model<any, any> | null> {
        return await this.loanDb.getLoanInfo(loanId)
    }

    public async getPaymentSchedule(loanId: string): Promise<Model<any, any>[]> {
        return await this.loanDb.getPaymentSchedule(loanId)
    }

    public async getLoanActivity(loanId: string): Promise<Model<any, any>[]> {
        return await this.loanDb.getLoanActivity(loanId)
    }

    public async getLoanRepaymentActivity(loanId: string): Promise<Model<any, any>[]> {
        return await this.loanDb.getLoanRepaymentActivity(loanId)
    }

    public async getLoanCustomerId(loanId: string): Promise<string | null> {
        const loanInfo = await this.loanDb.getLoanInfo(loanId)
        return loanInfo?.getDataValue('UserId')
    }

    public async requestForLoan(loanRequestPayload: LoanCreationRequest, customer_id: string): Promise<Model<any, any>> {
        let { amount, terms, termType } = loanRequestPayload;
        if (!termType) {
            termType = LoanTermType.WEEKLY;
        }
        return await this.loanDb.createLoan(amount, terms, termType, customer_id);
    }

    public async getPendingLoans(): Promise<Model<any, any>[]> {
        return await this.loanDb.getAllLoans({
            status: LoanStatus.PENDING
        })
    }

    public async verifyLoan(loanVerificationRequest: LoanVerificationRequest, admin_id: number): Promise<Model<any, any>> {
        let { loanId, status, remark } = loanVerificationRequest;
        if (!remark) {
            remark = ""
        }
        return await this.loanDb.verifyLoan(loanId, status, remark, admin_id);
    }

    public async repayLoan(loanRepaymentRequest: LoanRepaymentRequest): Promise<Model<any, any>> {
        let { loanId, amount } = loanRepaymentRequest;
        return await this.loanDb.repayLoan(loanId, amount);
    }

}