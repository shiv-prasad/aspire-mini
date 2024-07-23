import { Response, NextFunction } from 'express';
import { HttpStatusCodes } from '../enums/requestHelper';
import { UserRole } from '../enums/user';
import LoanService from '../services/loan';
import { AuthorizedRequest } from '../types/request';

/**
 * Middleware of Loan Related Actions
 */
export default class LoanMiddleware {

    private loanService: LoanService;

    constructor(
        loanService: LoanService
    ) {
        this.loanService = loanService;
    }

    /**
     * Checks if the loan requested in request exists or not 
     * and also verifies if the requesting user can access the loan (if present)
     * Admin -> Can view all the loans
     * Customer -> Can view loans only if it belongs to customer
     * @param req 
     * @param res 
     * @param next 
     * @returns 
     */
    public async checkLoan(req: AuthorizedRequest, res: Response, next: NextFunction) {
        try {
            // Get the loan information from DB
            const loanId: string = req.params['id']
            const loan = await this.loanService.getLoanInfo(loanId);

            // If loan is not present, respond back with Not found
            if (!loan) {
                return res.status(HttpStatusCodes.NOT_FOUND).json({ error: 'Loan Not Found' });
            }

            // Update the request with loan info
            req.loan = loan;
            
            // check if the requesting user is admin or customer 
            // and based on access, either proceed or respond back to user with Not found
            const userRole: UserRole = req.user?.getDataValue('role')
            const customerId = loan.getDataValue('UserId')
            if (userRole == UserRole.ADMIN || customerId == req.user?.getDataValue('id')) return next()
            
            return res.status(HttpStatusCodes.NOT_FOUND).json({ error: 'Loan Not Found' });
        } catch (err) {
            return res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({ error: 'Something went wrong' });
        }
    }

    /**
     * Applies the loan filter in thr request context based on role of user (Customer or Admin)
     * @param req 
     * @param res 
     * @param next 
     * @returns 
     */
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