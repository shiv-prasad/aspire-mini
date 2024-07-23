import { Model } from "sequelize";
import { UserRole } from "../enums/user";
import UserDB from "../utils/dbUtils/userDbUtil";

/**
 * User related Service Provider
 */
export default class UserService {

    private userDb: UserDB;

    constructor(userDb: UserDB) {
        this.userDb = userDb;
    }

    /**
     * Fetches the Role of the User
     * @param user 
     * @returns 
     */
    public async getUserRole(user: Model<any, any> | null): Promise<UserRole> {
        return await user?.getDataValue('role') as UserRole;
    }

    /**
     * Fetches the User by username. Returns Null if user is not found
     * @param username 
     * @returns 
     */
    public async getUserByUsername(username: string): Promise<Model<any, any> | null> {
        return await this.userDb.getUserByUsername(username);
    }

}