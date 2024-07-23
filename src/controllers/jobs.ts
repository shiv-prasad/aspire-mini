import { Response, NextFunction } from 'express';
import { CustomError } from '../classes/customError';
import { HttpStatusCodes } from '../enums/requestHelper';
import LoanService from '../services/loan';
import { AuthorizedRequest } from '../types/request';

/**
 * Controller for APIs related to Cron Jobs
 */
export default class JobsController {
    
    loanService: LoanService;

    constructor(loanService: LoanService) {
        this.loanService = loanService;
    }

    /**
     * Check if there is any repayment schedule which is not paid yet,
     * Consider only those schedules where status is APPROVED
     * 
     * If there is any schedule which is not paid yet mark it as DEFAULTED
     * 
     * Resulting Loan Activity : DEFAULTED
     * Resulting Repayment Activity : DEFAULTED
     * @param req 
     * @param res 
     * @param next 
     */
    async checkAndUpdateOutstandingLoans(req: AuthorizedRequest, res: Response, next: NextFunction) {
        try {
            const defaultedLoans = await this.loanService.defaultRepayments()
            res.status(HttpStatusCodes.OK).json({
                "totalLoansDefaulted": defaultedLoans
            })
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