import { ENUM, JSON } from 'sequelize';
import { sequelize } from '../config/database';
import { RepaymentActivityType } from '../enums/loan';
import { Loan } from './loan';

export const RepaymentActivity = sequelize.define('RepaymentActivity', {
    activity: {
        type: ENUM(
            RepaymentActivityType.SCHEDULE_CREATED,
            RepaymentActivityType.PAYMENT_MADE,
            RepaymentActivityType.SCHEDULE_UPDATED,
            RepaymentActivityType.DEFAULTED,
        ),
        allowNull: false,
    },
    metadata: {
        type: JSON
    },
})

Loan.hasMany(RepaymentActivity, {as: 'LoanRepaymentActivities', foreignKey: 'LoanId'})