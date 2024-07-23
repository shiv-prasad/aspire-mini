import { Response, NextFunction } from 'express';
import { CustomError } from '../classes/customError';
import LoanService from '../services/loan';
import { AuthorizedRequest } from "../types/request";

/**
 * Controller for Activity APIs
 */
export default class ActivityController {
    private loanService: LoanService;

    constructor(loanService: LoanService) {
        this.loanService = loanService;
    }

    /**
     * Getting all the activities happening on a loan account
     * Sorted in ascending order of activity timestamp
     * @param req 
     * @param res 
     * @param next 
     */
    async getLoanActivity(req: AuthorizedRequest, res: Response, next: NextFunction) {
        try {
            res.json(await this.loanService.getLoanActivity(req.params['id']))
            next()
        } catch (err: any) {
            if (err instanceof CustomError) {
                next(err);
            } else {
                next(new CustomError(`Error while getting loan activity`))
            }
        }
    }
    
    /**
     * Getting all the activities happening related to repayment of the loan
     * Sorted in ascending order of activity timestamp
     * @param req 
     * @param res 
     * @param next 
     */
    async getRepaymentActivity(req: AuthorizedRequest, res: Response, next: NextFunction) {
        try {
            res.json(await this.loanService.getLoanRepaymentActivity(req.params['id']))
            next()
        } catch (err: any) {
            if (err instanceof CustomError) {
                next(err);
            } else {
                next(new CustomError(`Error while getting loan repayment activity`))
            }
        }
    }

}