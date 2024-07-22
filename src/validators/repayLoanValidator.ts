import { ValidationError } from "../classes/validationError";
import { LoanRepaymentRequest } from "../types/loan";
import { BaseValidator } from "./baseValidator";

export class RepayLoanValidator extends BaseValidator {

    constructor(payload: LoanRepaymentRequest) {
        super(payload);
    }

    validate() {
        let { amount, loanId } = this.payload;
        if (!amount || !loanId) {
            throw new ValidationError(`Missing amount / loanId field`, this.payload)
        }
        if (isNaN(amount)) {
            throw new ValidationError(`Invalid Amount`, this.payload)
        }
        if (amount <= 0) {
            throw new ValidationError(`Invalid Amount`, this.payload)
        }
    }

}