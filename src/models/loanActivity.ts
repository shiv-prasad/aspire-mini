import { ENUM, JSON } from 'sequelize';
import { sequelize } from '../config/database';
import { LoanActivityType } from '../enums/loan';
import { Loan } from './loan';

export const LoanActivity = sequelize.define('LoanActivity', {
    activity: {
        type: ENUM(LoanActivityType.REQUEST_CREATED, LoanActivityType.LOAN_APPROVED, LoanActivityType.LOAN_REJECTED, LoanActivityType.REPAYMENT_DONE, LoanActivityType.LOAN_CLOSED, LoanActivityType.DEFAULTED),
        allowNull: false,
    },
    metadata: {
        type: JSON
    },
})

Loan.hasMany(LoanActivity, {as: 'LoanActivities', foreignKey: 'LoanId'})