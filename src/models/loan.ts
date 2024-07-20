import { DECIMAL, ENUM, DATE, NUMBER } from 'sequelize';
import { sequelize } from '../config/database';
import { LoanStatus, LoanTermType } from '../enums/loan';
import { User } from './user';

export const Loan = sequelize.define('Loan', {
    totalAmount: {
        type: DECIMAL,
        allowNull: false,
    },
    status: {
        type: ENUM(LoanStatus.PENDING, LoanStatus.APPROVED, LoanStatus.REJECTED, LoanStatus.PAID),
        defaultValue: LoanStatus.PENDING
    },
    totalTerms: {
        type: NUMBER,
        defaultValue: 12
    },
    termType: {
        type: ENUM(LoanTermType.WEEKLY, LoanTermType.MONTHLY),
        defaultValue: LoanTermType.WEEKLY
    },
    remainingAmount: {
        type: DECIMAL,
        allowNull: false,
    },
    lastPaymentDate: {
        type: DATE
    },
    closingDate: {
        type: DATE
    }
})

User.hasMany(Loan, {as: 'Customer', foreignKey: 'UserId'})