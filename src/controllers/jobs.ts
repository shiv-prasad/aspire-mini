import { Response, NextFunction } from 'express';
import { CustomError } from '../classes/customError';
import { HttpStatusCodes } from '../enums/requestHelper';
import LoanService from '../services/loan';
import { AuthorizedRequest } from '../types/request';

export default class JobsController {
    
    loanService: LoanService;

    constructor(loanService: LoanService) {
        this.loanService = loanService;
    }

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