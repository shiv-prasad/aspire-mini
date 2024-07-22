import { ValidationError } from "../classes/validationError";
import { LoanStatus } from "../enums/loan";
import { LoanVerificationRequest } from "../types/loan";
import { BaseValidator } from "./baseValidator";

export class LoanVerificationValidator extends BaseValidator {

    constructor(payload: LoanVerificationRequest) {
        super(payload);
    }

    validate() {
        let { loanId, status } = this.payload;
        if (!loanId || !status) {
            throw new ValidationError(`Missing Mandatory fields: loanId, status!`, this.payload)
        }
        if (![LoanStatus.APPROVED, LoanStatus.REJECTED].includes(status)) {
            throw new ValidationError(`Invalid Loan Status Provided`, this.payload)
        }
    }

}