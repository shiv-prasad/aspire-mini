import { Response, NextFunction } from 'express';
import { CustomError } from '../classes/customError';
import LoanService from '../services/loan';

import { AuthorizedRequest } from "../types/request";


export default class ActivityController {

    loanService: LoanService;

    constructor(loanService: LoanService) {
        this.loanService = loanService;
    }

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
    
    async getRepaymentActivity(req: AuthorizedRequest, res: Response, next: NextFunction) {
        try {
            res.json(await this.loanService.getLoanRepaymentActivity(req.params['id']))
            next()
        } catch (err: any) {
            // console.log(err);
            if (err instanceof CustomError) {
                next(err);
            } else {
                next(new CustomError(`Error while getting loan repayment activity`))
            }
        }
    }

}