import { Model } from "sequelize";
import { LoanStatus, LoanTermType } from "../enums/loan";
import { LoanCreationRequest, LoanRepaymentRequest, LoanVerificationRequest } from "../types/loan";
import LoanDB from "../utils/dbUtils/loanDbUtil";

/**
 * Loan Related Service Provider
 */
export default class LoanService {
    private loanDb: LoanDB

    constructor(loanDb: LoanDB) {
        this.loanDb = loanDb;
    }

    /**
     * Get all the loans for the given filter
     * @param forceFilter 
     * @returns 
     */
    public async getAllLoans(forceFilter: any): Promise<Model<any, any>[]> {
        if (!forceFilter) forceFilter = {};
        return await this.loanDb.getAllLoans(forceFilter)
    }

    /**
     * Get Loan Info for a given loanId
     * @param loanId 
     * @returns 
     */
    public async getLoanInfo(loanId: string): Promise<Model<any, any> | null> {
        return await this.loanDb.getLoanInfo(loanId)
    }

    /**
     * Fetches the Repayment Schedule for the specified Loan Account
     * @param loanId 
     * @returns 
     */
    public async getPaymentSchedule(loanId: string): Promise<Model<any, any>[]> {
        return await this.loanDb.getPaymentSchedule(loanId)
    }

    /**
     * Fetches the Loan Activities for the specified Loan Account
     * @param loanId 
     * @returns 
     */
    public async getLoanActivity(loanId: string): Promise<Model<any, any>[]> {
        return await this.loanDb.getLoanActivity(loanId)
    }

    /**
     * Fetches the Loan Repayment Activities for the specified Loan Account
     * @param loanId 
     * @returns 
     */
    public async getLoanRepaymentActivity(loanId: string): Promise<Model<any, any>[]> {
        return await this.loanDb.getLoanRepaymentActivity(loanId)
    }

    /**
     * Creates a new Loan Request for a given Customer
     * If term type is not specified, assume by default as WEEKLY
     * @param loanRequestPayload 
     * @param customerId 
     * @returns 
     */
    public async requestForLoan(loanRequestPayload: LoanCreationRequest, customerId: string): Promise<Model<any, any>> {
        let { amount, terms, termType } = loanRequestPayload;
        if (!termType) {
            termType = LoanTermType.WEEKLY;
        }
        return await this.loanDb.createLoan(amount, terms, termType, customerId);
    }

    /**
     * Fetch all the loans which has status as PENDING
     * @returns 
     */
    public async getPendingLoans(): Promise<Model<any, any>[]> {
        return await this.loanDb.getAllLoans({
            status: LoanStatus.PENDING
        })
    }

    /**
     * Verifies a loan request
     * @param loanVerificationRequest 
     * @param adminId 
     * @returns 
     */
    public async verifyLoan(loanVerificationRequest: LoanVerificationRequest, adminId: number): Promise<Model<any, any>> {
        let { loanId, status, remark } = loanVerificationRequest;
        if (!remark) {
            remark = ""
        }
        return await this.loanDb.verifyLoan(loanId, status, remark, adminId);
    }

    /**
     * Repay the Loan with the specified amount
     * @param loanRepaymentRequest 
     * @returns 
     */
    public async repayLoan(loanRepaymentRequest: LoanRepaymentRequest): Promise<Model<any, any>> {
        let { loanId, amount } = loanRepaymentRequest;
        return await this.loanDb.repayLoan(loanId, amount);
    }

    /**
     * Check for unpaid loan for past due date and mark them as DEFAULTED
     * @returns 
     */
    public async defaultRepayments(): Promise<number> {
        return await this.loanDb.defaultRepayments();
    }

}