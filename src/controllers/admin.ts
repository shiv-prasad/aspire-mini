import { Response, NextFunction } from 'express';
import { CustomError } from '../classes/customError';
import { ValidationError } from '../classes/validationError';
import { HttpStatusCodes } from '../enums/requestHelper';
import CustomerService from '../services/customer';
import LoanService from '../services/loan';
import { CreateCustomerRequest } from '../types/customer';
import { LoanVerificationRequest } from '../types/loan';
import { AuthorizedRequest } from '../types/request';
import { CreateCustomerValidator } from '../validators/createCustomerValidator';
import { LoanVerificationValidator } from '../validators/verifyLoanValidator';

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
            new LoanVerificationValidator(loanVerificationPayload).validate()
            res.json(await this.loanService.verifyLoan(loanVerificationPayload, req.user?.getDataValue('id')));
            next()
        } catch (err: any) {
            if (err instanceof ValidationError) {
                next(new CustomError(err.message, HttpStatusCodes.BAD_REQUEST, err.additionalInfo));
            } else if (err instanceof CustomError) {
                next(err);
            } else {
                next(new CustomError(`Error while fetching pending loans`))
            }
        }
    }

    async createCustomer(req: AuthorizedRequest, res: Response, next: NextFunction) {
        const createCustomerPayload = req.body as CreateCustomerRequest;
        try {
            new CreateCustomerValidator(createCustomerPayload).validate()
            const customer = await this.customerService.create(createCustomerPayload);
            res.json(customer);
            next()
        } catch (err: any) {
            if (err instanceof ValidationError) {
                next(new CustomError(err.message, HttpStatusCodes.BAD_REQUEST, err.additionalInfo));
            } else if (err instanceof CustomError) {
                next(err);
            } else {
                next(new CustomError(`Error while creating customer`))
            }
        }
    }

}
