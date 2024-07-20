import { Response, NextFunction } from 'express';
import { HttpStatusCodes } from '../enums/requestHelper';
import { UserRole } from '../enums/user';
import LoanService from '../services/loan';
import { AuthorizedRequest } from '../types/request';

export default class LoanMiddleware {

    private loanService: LoanService;

    constructor(
        loanService: LoanService
    ) {
        this.loanService = loanService;
    }

    public async checkLoan(req: AuthorizedRequest, res: Response, next: NextFunction) {
        try {
            const loanId: string = req.params['id']
            const loan = await this.loanService.getLoanInfo(loanId);
            if (!loan) {
                return res.status(HttpStatusCodes.NOT_FOUND).json({ error: 'Loan Not Found' });
            }
            req.loan = loan;
            const userRole: UserRole = req.user?.getDataValue('role')
            if (userRole == UserRole.ADMIN) return next()
            const customerId = loan.getDataValue('UserId')
            if (customerId == req.user?.getDataValue('id')) return next()
            return res.status(HttpStatusCodes.NOT_FOUND).json({ error: 'Loan Not Found' });
        } catch (err) {
            return res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({ error: 'Something went wrong' });
        }
    }

    public async listLoan(req: AuthorizedRequest, res: Response, next: NextFunction) {
        try {
            const userRole: UserRole = req.user?.getDataValue('role')
            if (userRole == UserRole.CUSTOMER) {
                req.forceLoanFilter = {
                    'UserId': req.user?.getDataValue('id')
                } 
            }
            next();
        } catch (err) {
            return res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({ error: 'Something went wrong' });
        }
    }
}