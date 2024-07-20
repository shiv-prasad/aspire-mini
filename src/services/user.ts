import { Model } from "sequelize";
import { UserRole } from "../enums/user";
import UserDB from "../utils/dbUtils/userDbUtil";

export default class UserService {

    private userDb: UserDB;

    constructor(userDb: UserDB) {
        this.userDb = userDb;
    }

    public async getUserRole(user: Model<any, any> | null): Promise<UserRole> {
        return await user?.getDataValue('role') as UserRole;
    }

    public async getUserByUsername(username: string): Promise<Model<any, any> | null> {
        return await this.userDb.getUserByUsername(username);
    }

}