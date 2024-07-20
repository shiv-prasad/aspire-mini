import { STRING, ENUM } from 'sequelize';
import { sequelize } from '../config/database';
import { UserRole } from '../enums/user';

export const User = sequelize.define('User', {
    firstName: {
        type: STRING,
        allowNull: false
    },
    lastName: {
        type: STRING,
        allowNull: false
    },
    username: {
        type: STRING,
        allowNull: false
    },
    role: {
        type: ENUM(UserRole.ADMIN, UserRole.CUSTOMER),
        allowNull: false
    }
})