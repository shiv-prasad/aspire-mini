import { ValidationError } from "../classes/validationError";
import { LoanTermType } from "../enums/loan";
import { LoanCreationRequest } from "../types/loan";
import { BaseValidator } from "./baseValidator";

export class RequestLoanValidator extends BaseValidator {

    constructor(payload: LoanCreationRequest) {
        super(payload);
    }

    validate() {
        let { amount, terms, termType } = this.payload;
        if (!amount || !terms) {
            throw new ValidationError(`Missing amount / terms field`, this.payload)
        }
        if (isNaN(amount) || isNaN(terms)) {
            throw new ValidationError(`Invalid Amount / term`, this.payload)
        }
        if (amount <= 0 || terms <= 0) {
            throw new ValidationError(`Invalid Amount / term`, this.payload)
        }
        if (termType && ![LoanTermType.WEEKLY, LoanTermType.MONTHLY].includes(termType)) {
            throw new ValidationError(`Invalid Term Type`, this.payload)
        }

    }

}