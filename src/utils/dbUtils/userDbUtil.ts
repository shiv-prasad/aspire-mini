import { Model } from "sequelize";
import { UserRole } from "../../enums/user";
import { User } from "../../models/user";

export default class UserDB {
    
    async createUser(firstName: string, lastName: string, username: string, role: UserRole): Promise<Model<any, any>> {
        return await User.create({
            firstName: firstName,
            lastName: lastName,
            username: username,
            role: role
        });
    }

    async getUserByUsername(username: string): Promise<Model<any, any> | null> {
        return await User.findOne({ where: { username } })
    }

}