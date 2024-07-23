import { Model } from "sequelize";
import { ValidationError } from "../classes/validationError";
import { UserRole } from "../enums/user";
import { CreateCustomerRequest } from "../types/customer";
import UserDB from "../utils/dbUtils/userDbUtil";

/**
 * Customer Related Service Provider
 */
export default class CustomerService {
    private userDb: UserDB;

    constructor(userDb: UserDB) {
        this.userDb = userDb;
    }

    /**
     * Create a new customer
     * If customer with same username already exists, throw exception
     * @param createCustomerData 
     * @returns 
     */
    public async create(createCustomerData: CreateCustomerRequest): Promise<Model<any, any>> {
        const { firstName, lastName, username } = createCustomerData;

        const existingUser = await this.userDb.getUserByUsername(username);
        if (existingUser) {
            throw new ValidationError(`User already exists with same username`);
        }

        return await this.userDb.createUser(
            firstName,
            lastName,
            username,
            UserRole.CUSTOMER
        )
    }

}