import { Model } from "sequelize";
import { UserRole } from "../../enums/user";
import { User } from "../../models/user";

/**
 * DB handler for User Model
 */
export default class UserDB {
    
    /**
     * Creates the user in DB with specified role
     * @param firstName 
     * @param lastName 
     * @param username 
     * @param role 
     * @returns 
     */
    async createUser(firstName: string, lastName: string, username: string, role: UserRole): Promise<Model<any, any>> {
        return await User.create({
            firstName: firstName,
            lastName: lastName,
            username: username,
            role: role
        });
    }

    /**
     * Get the user by username
     * @param username 
     * @returns 
     */
    async getUserByUsername(username: string): Promise<Model<any, any> | null> {
        return await User.findOne({ where: { username } })
    }

}