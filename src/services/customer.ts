import { Model } from "sequelize";
import { CustomError } from "../classes/customError";
import { HttpStatusCodes } from "../enums/requestHelper";
import { UserRole } from "../enums/user";
import { CreateCustomerRequest } from "../types/customer";
import UserDB from "../utils/dbUtils/userDbUtil";

export default class CustomerService {
    private userDb: UserDB;

    constructor(userDb: UserDB) {
        this.userDb = userDb;
    }

    public async create(createCustomerData: CreateCustomerRequest): Promise<Model<any, any>> {
        const { firstName, lastName, username } = createCustomerData;

        const existingUser = await this.userDb.getUserByUsername(username);
        if (existingUser) {
            throw new CustomError(`User already exists with same username`, HttpStatusCodes.BAD_REQUEST);
        }

        return await this.userDb.createUser(
            firstName,
            lastName,
            username,
            UserRole.CUSTOMER
        )
    }

}