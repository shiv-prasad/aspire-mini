import { LoanStatus, LoanTermType } from "../enums/loan"

export type LoanCreationRequest = {
    amount: number,
    terms: number,
    termType?: LoanTermType,
}

export type LoanVerificationRequest = {
    loanId: number,
    status: LoanStatus,
    remark?: string,
}

export type LoanRepaymentRequest = {
    loanId: string,
    amount: number,
}