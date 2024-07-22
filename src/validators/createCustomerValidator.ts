import { ValidationError } from "../classes/validationError";
import { CreateCustomerRequest } from "../types/customer";
import { BaseValidator } from "./baseValidator";

export class CreateCustomerValidator extends BaseValidator {

    constructor(payload: CreateCustomerRequest) {
        super(payload);
    }

    validate() {
        const { firstName, lastName, username } = this.payload;
        if (!firstName || !lastName || !username) {
            throw new ValidationError(`Missing Mandatory fields: firstName, lastName, username!`, this.payload)
        }
    }

}