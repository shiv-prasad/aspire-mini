export abstract class BaseValidator {

    payload: any;

    constructor(payload: any) {
        this.payload = payload;
    }

    abstract validate(): void;

}