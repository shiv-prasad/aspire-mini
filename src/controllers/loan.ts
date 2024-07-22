import { Response, NextFunction } from 'express';
import { CustomError } from '../classes/customError';
import LoanService from '../services/loan';
import { AuthorizedRequest } from "../types/request";

export default class LoansController {
    loanService: LoanService;

    constructor(loanService: LoanService) {
        this.loanService = loanService;
    }

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
