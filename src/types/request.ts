import { Request } from "express";
import { Model } from "sequelize";

export interface AuthorizedRequest extends Request {
    user: Model<any, any> | null;
    loan: Model<any, any> | null;
    forceLoanFilter: any
}