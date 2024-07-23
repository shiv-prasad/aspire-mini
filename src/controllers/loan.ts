import { Response, NextFunction } from 'express';
import { CustomError } from '../classes/customError';
import LoanService from '../services/loan';
import { AuthorizedRequest } from "../types/request";

/**
 * Controller for loan related APIs
 */
export default class LoansController {
    loanService: LoanService;

    constructor(loanService: LoanService) {
        this.loanService = loanService;
    }

    /**
     * Get all the loan details along with Repayment Schedule / Loan and Repayment Activities
     * @param req 
     * @param res 
     * @param next 
     */
    async getLoanDetails(req: AuthorizedRequest, res: Response, next: NextFunction) {
        try {
            res.json(await this.loanService.getLoanInfo(req.params['id']))
            next()
        } catch (err: any) {
            if (err instanceof CustomError) {
                next(err);
            } else {
                next(new CustomError(`Error while getting loans`))
            }
        }
    }
    
    /**
     * Get all the loans, which are owned by user 
     * (if admin user is calling the API, get loans for all the users)
     * @param req 
     * @param res 
     * @param next 
     */
    async getAllLoans(req: AuthorizedRequest, res: Response, next: NextFunction) {
        try {
            res.json(await this.loanService.getAllLoans(req.forceLoanFilter))
            next()
        } catch (err: any) {
            if (err instanceof CustomError) {
                next(err);
            } else {
                next(new CustomError(`Error while getting loans`))
            }
        }
    }

    /**
     * Get Loan Repayment Schedule for the specified loan 
     * @param req 
     * @param res 
     * @param next 
     */
    async getLoanPaymentSchedule(req: AuthorizedRequest, res: Response, next: NextFunction) {
        try {
            res.json(await this.loanService.getPaymentSchedule(req.params['id']))
            next()
        } catch (err: any) {
            if (err instanceof CustomError) {
                next(err);
            } else {
                next(new CustomError(`Error while getting loans`))
            }
        }

    }

}
