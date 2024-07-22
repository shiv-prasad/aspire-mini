import { Response, NextFunction } from 'express';
import { CustomError } from '../classes/customError';
import { LoanStatus } from '../enums/loan';
import { HttpStatusCodes } from '../enums/requestHelper';
import CustomerService from '../services/customer';
import LoanService from '../services/loan';
import { LoanCreationRequest, LoanRepaymentRequest } from '../types/loan';
import { AuthorizedRequest } from '../types/request';
import { CustomerDetailResponse } from '../types/response';

export default class CustomerController {
    private customerService: CustomerService;
    private loanService: LoanService;
    
    constructor(customerService: CustomerService, loanService: LoanService) {
        this.customerService = customerService;
        this.loanService = loanService;
    }

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
            const loans = await this.loanService.getAllLoans({UserId: req.user.getDataValue('id')});
            response.totalLoans = loans.length;
            response.requestedLoans = loans.filter(loan => loan.getDataValue('status') === LoanStatus.PENDING).length;
            response.rejectedLoans = loans.filter(loan => loan.getDataValue('status') === LoanStatus.REJECTED).length;
            response.activeLoans = loans.filter(loan => loan.getDataValue('status') === LoanStatus.APPROVED).length;
            response.completedLoans = loans.filter(loan => loan.getDataValue('status') === LoanStatus.PAID).length;

            response.totalLiability = loans.reduce((sum, loan) => sum + parseFloat(loan.getDataValue('remainingAmount')), 0);
            
            response.totalPaid = loans.reduce((sum, loan) => {
                const paidAmount = parseFloat(loan.getDataValue('totalAmount')) - parseFloat(loan.getDataValue('remainingAmount'));
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

    async requestLoan(req: AuthorizedRequest, res: Response, next: NextFunction) {
        const loanRequestPayload = req.body as LoanCreationRequest;
        try {
            let { amount, terms } = loanRequestPayload;
            if (!amount || !terms) {
                next(new CustomError(`Missing amount / terms field`, HttpStatusCodes.BAD_REQUEST));
                return
            }
            res.json(await this.loanService.requestForLoan(loanRequestPayload, req.user?.getDataValue('id')))
            next()
        } catch (err: any) {
            if (err instanceof CustomError) {
                next(err);
            } else {
                next(new CustomError(`Error while raising loan request`))
            }
        }
    }

    async repayLoan(req: AuthorizedRequest, res: Response, next: NextFunction) {
        const loanRepaymentPayload = req.body as LoanRepaymentRequest;
        try {
            let { amount, loanId } = loanRepaymentPayload;
            if (!amount || !loanId) {
                next(new CustomError(`Missing amount / loanId field`, HttpStatusCodes.BAD_REQUEST));
                return
            }
            const loan = await this.loanService.getLoanInfo(loanId)
            if (!loan) {
                next(new CustomError(`Loan not found`, HttpStatusCodes.BAD_REQUEST))
                return
            }
            if (loan.getDataValue('UserId') != req.user?.getDataValue('id')) {
                next(new CustomError(`Unauthorized loan access`, HttpStatusCodes.UNAUTHORIZED))
                return
            }
            res.json(await this.loanService.repayLoan(loanRepaymentPayload))
            next()
        } catch (err: any) {
            if (err instanceof CustomError) {
                next(err);
            } else {
                next(new CustomError(`Error while repaying loan`))
            }
        }
    }

}