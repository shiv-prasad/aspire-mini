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

/**
 * Controller for Admin related APIs
 */
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

    /**
     * Get all the loan requests created by customers
     * Loan Status should be pending
     * Sorted in ascending order of loan request creation time
     * @param req 
     * @param res 
     * @param next 
     */
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

    /**
     * Verify a loan by either approving or rejecting
     * Can add a remark when verifying.
     * Remark will be reflected in the loan activity
     * 
     * Admin can only verify the loan if Loan Status is PENDING
     * 
     * Loan will be updated with status APPROVED / REJECTED
     * Repayment schedule will be updated with status APPROVED / REJECTED
     * 
     * Resulting Loan Activity LOAN_APPROVED / LOAN_REJECTED
     * @param req 
     * @param res 
     * @param next 
     */
    async verifyLoan(req: AuthorizedRequest, res: Response, next: NextFunction) {
        const loanVerificationPayload = req.body as LoanVerificationRequest;
        try {
            // Validate the loan verification payload. Throw validation error for invalid request payload else pass
            new LoanVerificationValidator(loanVerificationPayload).validate()

            // Call Loan Service to verify the loan
            res.json(await this.loanService.verifyLoan(loanVerificationPayload, req.user?.getDataValue('id')));
            next()
        } catch (err: any) {
            if (err instanceof ValidationError) {
                next(new CustomError(err.message, HttpStatusCodes.BAD_REQUEST, err.additionalInfo));
            } else if (err instanceof CustomError) {
                next(err);
            } else {
                next(new CustomError(`Error while verifying loans`))
            }
        }
    }

    /**
     * Create a new customer with customer details like name and username info
     * Throws error if username already exists
     * @param req 
     * @param res 
     * @param next 
     */
    async createCustomer(req: AuthorizedRequest, res: Response, next: NextFunction) {
        const createCustomerPayload = req.body as CreateCustomerRequest;
        try {
            // Validate the customer creation payload
            new CreateCustomerValidator(createCustomerPayload).validate()

            // Call Customer Service to create the customer
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
