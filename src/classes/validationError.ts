export class ValidationError extends Error {
    additionalInfo!: any;

    constructor(message: string, additionalInfo: any = {}) {
        super(message);
        this.additionalInfo = additionalInfo
    }
}