import { Response, NextFunction } from 'express';
import { CustomError } from '../classes/customError';
import { ValidationError } from '../classes/validationError';
import { LoanStatus } from '../enums/loan';
import { HttpStatusCodes } from '../enums/requestHelper';
import LoanService from '../services/loan';
import { LoanCreationRequest, LoanRepaymentRequest } from '../types/loan';
import { AuthorizedRequest } from '../types/request';
import { CustomerDetailResponse } from '../types/response';
import { RepayLoanValidator } from '../validators/repayLoanValidator';
import { RequestLoanValidator } from '../validators/requestLoanValidator';

/**
 * Controller for Customer related APIs
 */
export default class CustomerController {
    private loanService: LoanService;
    
    constructor(loanService: LoanService) {
        this.loanService = loanService;
    }

    /**
     * Get user info along with insights on user's loans
     * Insights:
     * - Total number of loans user has created
     * - Total number of loans in request state
     * - Total number of loans which got rejected
     * - Total number of loans which got approved and running
     * - Total number of loans where user has paid completely
     * - Total Liability on user
     * - Total Amount paid by the user till date
     * @param req 
     * @param res 
     * @param next 
     * @returns 
     */
    async getUserInfo(req: AuthorizedRequest, res: Response, next: NextFunction){
        if (!req.user) {
            next(new CustomError(`Customer Not Found`, HttpStatusCodes.NOT_FOUND))
            return;
        }
        try {
            const response: CustomerDetailResponse = {
                user: req.user,
                totalLoans: 0,
                requestedLoans: 0,
                rejectedLoans: 0,
                activeLoans: 0,
                completedLoans: 0,
                totalLiability: 0,
                totalPaid: 0,
            }

            // Get all the loans user is part of and build the summary
            const loans = await this.loanService.getAllLoans({UserId: req.user.getDataValue('id')});
            
            response.totalLoans = loans.length;
            
            // Get count of total requested, approved, rejected and completed loans
            response.requestedLoans = loans.filter(loan => loan.getDataValue('status') === LoanStatus.PENDING).length;
            response.rejectedLoans = loans.filter(loan => loan.getDataValue('status') === LoanStatus.REJECTED).length;
            response.activeLoans = loans.filter(loan => loan.getDataValue('status') === LoanStatus.APPROVED).length;
            response.completedLoans = loans.filter(loan => loan.getDataValue('status') === LoanStatus.PAID).length;

            // Total liability will be the total amount remaining in all the loans of the user
            response.totalLiability = loans.reduce((sum, loan) => sum + parseFloat(loan.getDataValue('remainingAmount')), 0);
            
            // Total liability will be the total amount user already paid till now sum(loan amount - remaining amount)
            response.totalPaid = loans.reduce((sum, loan) => {
                const paidAmount: any = parseFloat(loan.getDataValue('totalAmount')) - parseFloat(loan.getDataValue('remainingAmount'));
                return sum + (paidAmount > 0 ? paidAmount : 0);
            }, 0);

            res.json(response)
            next()
        } catch (err: any) {
            if (err instanceof CustomError) {
                next(err);
            } else {
                next(new CustomError(`Error while getting customer summary`))
            }
        }
    }

    /**
     * New loan request by customer
     * Payload to include, total amount required, term type (WEEKLY / MONTHLY) and no of terms
     * If a term type is not specified, default WEEKLY term will be considered
     * Loan will be created with status PENDING
     * Repayment schedule will be created with status PENDING
     * 
     * Resulting Loan Activity REQUEST_CREATED
     * Resulting Repayment Activity SCHEDULE_CREATED
     * @param req 
     * @param res 
     * @param next 
     */
    async requestLoan(req: AuthorizedRequest, res: Response, next: NextFunction) {
        const loanRequestPayload = req.body as LoanCreationRequest;
        try {
            // Validate the loan request payload
            new RequestLoanValidator(loanRequestPayload).validate()

            // Call loan service for creating new loan request
            res.json(await this.loanService.requestForLoan(loanRequestPayload, req.user?.getDataValue('id')))
            next()
        } catch (err: any) {
            if (err instanceof ValidationError) {
                next(new CustomError(err.message, HttpStatusCodes.BAD_REQUEST, err.additionalInfo));
            } else if (err instanceof CustomError) {
                next(err);
            } else {
                next(new CustomError(`Error while raising loan request`))
            }
        }
    }

    /**
     * Customer Repayment Request for amount greater than next repayment amount
     * 
     * Customer can only do repayment is Loan Status is APPROVED / DEFAULTED
     * 
     * If the amount is more than the next repayment amount, 
     * the next set of repayment schedules will be rebalanced with 
     * new amount (total amount remaining / total repayment schedule remaining)
     * --> No effect on amount on the schedule for which the amount is paid, it will be just PAID
     * 
     * If the amount paid is equal to remaining amount, the Loan will be marked as PAID
     * 
     * Resulting Loan Activity PAID (when all remaining amount is paid)
     * Resulting Repayment Activity : PAYMENT_MADE, SCHEDULE_UPDATED (if the amount paid is greater than next repayment schedule amount)
     * @param req 
     * @param res 
     * @param next 
     */
    async repayLoan(req: AuthorizedRequest, res: Response, next: NextFunction) {
        const loanRepaymentPayload = req.body as LoanRepaymentRequest;
        try {
            // Validate the repayment payload
            new RepayLoanValidator(loanRepaymentPayload).validate()

            // Customer can only pay for a loan which is present and belongs to the customer itself
            let { loanId } = loanRepaymentPayload;
            const loan = await this.loanService.getLoanInfo(loanId)
            if (!loan) {
                throw new ValidationError(`Loan not found`)
            }
            if (loan.getDataValue('UserId') != req.user?.getDataValue('id')) {
                throw new CustomError(`Unauthorized loan access`, HttpStatusCodes.UNAUTHORIZED)
            }

            // Repay the loan
            res.json(await this.loanService.repayLoan(loanRepaymentPayload))
            next()
        } catch (err: any) {
            if (err instanceof ValidationError) {
                next(new CustomError(err.message, HttpStatusCodes.BAD_REQUEST, err.additionalInfo));
            } else if (err instanceof CustomError) {
                next(err);
            } else {
                next(new CustomError(`Error while repaying loan`))
            }
        }
    }

}