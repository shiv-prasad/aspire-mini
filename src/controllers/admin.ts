import { Response, NextFunction } from 'express';
import { CustomError } from '../classes/customError';
import { LoanStatus } from '../enums/loan';
import { HttpStatusCodes } from '../enums/requestHelper';
import CustomerService from '../services/customer';
import LoanService from '../services/loan';
import { CreateCustomerRequest } from '../types/customer';
import { LoanVerificationRequest } from '../types/loan';
import { AuthorizedRequest } from '../types/request';

export default class AdminController {
    
    private customerService: CustomerService;
    private loanService: LoanService;

    constructor(
        customerService: CustomerService, 
        loanService: LoanService
    ) {
        this.customerService = customerService;
        this.loanService = loanService;
    }

    async getPendingLoanRequests(req: AuthorizedRequest, res: Response, next: NextFunction) {
        try {
            res.json(await this.loanService.getPendingLoans());
            next()
        } catch (err: any) {
            if (err instanceof CustomError) {
                next(err);
            } else {
                next(new CustomError(`Error while fetching pending loans`))
            }
        }
    }

    async verifyLoan(req: AuthorizedRequest, res: Response, next: NextFunction) {
        const loanVerificationPayload = req.body as LoanVerificationRequest;
        try {
            let { status } = loanVerificationPayload;
            if (![LoanStatus.APPROVED, LoanStatus.REJECTED].includes(status)) {
                next(new CustomError(`Invalid Loan Status Provided`, HttpStatusCodes.BAD_REQUEST))
                return;
            }
            res.json(await this.loanService.verifyLoan(loanVerificationPayload, req.user?.getDataValue('id')));
            next()
        } catch (err: any) {
            if (err instanceof CustomError) {
                next(err);
            } else {
                next(new CustomError(`Error while fetching pending loans`))
            }
        }
    }

    async createCustomer(req: AuthorizedRequest, res: Response, next: NextFunction) {
        const createCustomerPayload = req.body as CreateCustomerRequest;
        try {
            const { firstName, lastName, username } = createCustomerPayload;
            if (!firstName || !lastName || !username) {
                next(new CustomError(`Missing Mandatory fields: firstName, lastName, username!`, HttpStatusCodes.BAD_REQUEST, createCustomerPayload))
                return;
            }
            const customer = await this.customerService.create(createCustomerPayload);
            res.json(customer);
            next()
        } catch (err: any) {
            if (err instanceof CustomError) {
                next(err);
            } else {
                next(new CustomError(`Error while creating customer`))
            }
        }
    }

}
