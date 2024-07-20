import { DECIMAL, ENUM, DATE } from 'sequelize';
import { sequelize } from '../config/database';
import { RepaymentScheduleStatus } from '../enums/loan';
import { Loan } from './loan';

export const RepaymentSchedule = sequelize.define('RepaymentSchedule', {
    totalAmount: {
        type: DECIMAL,
        allowNull: false,
    },
    paymentDate: {
        type: DATE
    },
    status: {
        type: ENUM(
            RepaymentScheduleStatus.PENDING,
            RepaymentScheduleStatus.APPROVED,
            RepaymentScheduleStatus.REJECTED,
            RepaymentScheduleStatus.PAID,
            RepaymentScheduleStatus.DEFAULTED,
        ),
        defaultValue: RepaymentScheduleStatus.PENDING
    },
})

Loan.hasMany(RepaymentSchedule, {as: 'LoanRepaymentSchedules', foreignKey: 'LoanId'})
