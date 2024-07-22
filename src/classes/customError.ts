import { HttpStatusCodes } from "../enums/requestHelper";

export class CustomError {
    message!: string;
    status!: number;
    additionalInfo!: any;

    constructor(
        message: string, 
        status: number = HttpStatusCodes.INTERNAL_SERVER_ERROR, 
        additionalInfo: any = {}
    ) {
        this.message = message;
        this.status = status;
        this.additionalInfo = additionalInfo
    }
}