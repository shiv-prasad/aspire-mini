import { Model, Transaction, Op } from "sequelize";
import { CustomError } from "../../classes/customError";
import { sequelize } from "../../config/database";
import { LoanActivityType, LoanStatus, LoanTermType, RepaymentActivityType, RepaymentScheduleStatus } from "../../enums/loan";
import { HttpStatusCodes } from "../../enums/requestHelper";
import { Loan } from "../../models/loan";
import { LoanActivity } from "../../models/loanActivity";
import { RepaymentActivity } from "../../models/repaymentActivity";
import { RepaymentSchedule } from "../../models/repaymentSchedule";

export default class LoanDB {

    async getAllLoans(extraFilters = {}): Promise<Model<any, any>[]> {
        return await Loan.findAll({
            where: {
                ...extraFilters
            },
            include: [
                {
                    model: LoanActivity,
                    as: 'LoanActivities',
                    order: [
                        ['createdAt', 'ASC']
                    ]
                },
                {
                    model: RepaymentSchedule,
                    as: 'LoanRepaymentSchedules',
                    order: [
                        ['paymentDate', 'ASC']
                    ]
                },
                {
                    model: RepaymentActivity,
                    as: 'LoanRepaymentActivities',
                    order: [
                        ['createdAt', 'ASC']
                    ]
                },
            ],
            order: [
                [
                    sequelize.literal(`
                        CASE
                            WHEN \`Loan\`.\`status\` = '${LoanStatus.APPROVED}' THEN 1
                            WHEN \`Loan\`.\`status\` = '${LoanStatus.PAID}' THEN 2
                            WHEN \`Loan\`.\`status\` = '${LoanStatus.PENDING}' THEN 3
                            WHEN \`Loan\`.\`status\` = '${LoanStatus.REJECTED}' THEN 4
                            ELSE 5
                        END
                    `), 
                    'ASC'
                ],
                ['createdAt', 'ASC']
            ]
        });
    }

    async getLoanInfo(loanId: string): Promise<Model<any, any> | null> {
        return await Loan.findByPk(loanId, {
            include: [
                {
                    model: LoanActivity,
                    as: 'LoanActivities',
                    order: [
                        ['createdAt', 'ASC']
                    ]
                },
                {
                    model: RepaymentSchedule,
                    as: 'LoanRepaymentSchedules',
                    order: [
                        ['paymentDate', 'ASC']
                    ]
                },
                {
                    model: RepaymentActivity,
                    as: 'LoanRepaymentActivities',
                    order: [
                        ['createdAt', 'ASC']
                    ]
                },
            ],
        });
    }

    async getPaymentSchedule(loanId: string): Promise<Model<any, any>[]> {
        return await RepaymentSchedule.findAll({
            where: {
                LoanId: loanId
            },
            order: [
                ['paymentDate', 'ASC']
            ]
        });
    }

    async getLoanActivity(loanId: string): Promise<Model<any, any>[]> {
        return await LoanActivity.findAll({
            where: {
                LoanId: loanId
            },
            order: [
                ['createdAt', 'ASC']
            ]
        });
    }

    async getLoanRepaymentActivity(loanId: string): Promise<Model<any, any>[]> {
        return await RepaymentActivity.findAll({
            where: {
                LoanId: loanId
            },
            order: [
                ['createdAt', 'ASC']
            ]
        });
    }

    async createLoan(
        loanAmount: number, 
        totalTerms: number, 
        loanTermType: LoanTermType, 
        customer_id: string
    ): Promise<Model<any, any>> {
        const t: Transaction = await sequelize.transaction();
        try {
            const loan = await Loan.create({
                totalAmount: loanAmount,
                remainingAmount: loanAmount,
                totalTerms: totalTerms,
                termType: loanTermType,
                UserId: customer_id,
            }, { transaction: t });

            await LoanActivity.create({
                LoanId: loan.getDataValue('id'),
                activity: LoanActivityType.REQUEST_CREATED,
                metadata: {
                    amount: loanAmount,
                    totalTerms: totalTerms,
                },
            }, { transaction: t });

            const termDuration = loanTermType === LoanTermType.WEEKLY ? 7 : 30;
            const installmentAmount = loanAmount / totalTerms;

            for (let i = 0; i < totalTerms; i++) {
                const paymentDate = new Date();
                paymentDate.setDate(paymentDate.getDate() + (i + 1) * termDuration);

                await RepaymentSchedule.create({
                    LoanId: loan.getDataValue('id'),
                    totalAmount: installmentAmount,
                    paymentDate,
                    status: RepaymentScheduleStatus.PENDING,
                }, { transaction: t });

            }

            await RepaymentActivity.create({
                LoanId: loan.getDataValue('id'),
                activity: RepaymentActivityType.SCHEDULE_CREATED,
                metadata: {
                    installmentAmount: installmentAmount,
                },
            }, { transaction: t });

            await t.commit();
            return loan;
        } catch (error) {
            await t.rollback();
            throw new CustomError(`Error while creating loan: ${error}`);
        }
    }

    async verifyLoan(loanId: number, status: LoanStatus, remark: string, admin_id: number): Promise<Model<any, any>> {
        const t: Transaction = await sequelize.transaction();
        try {
            const loan = await Loan.findByPk(loanId, { transaction: t });
            if (!loan) {
                throw new CustomError('Loan not found!', HttpStatusCodes.BAD_REQUEST)
            }

            if (loan.getDataValue('status') !== LoanStatus.PENDING) {
                throw new CustomError('Loan is not open for verification!', HttpStatusCodes.BAD_REQUEST)
            }

            await loan.update({ status: status }, { transaction: t });

            await RepaymentSchedule.update(
                { status: status },
                { where: { LoanId: loanId }, transaction: t },
            );

            await LoanActivity.create({
                activity: status === LoanStatus.APPROVED ? LoanActivityType.LOAN_APPROVED : LoanActivityType.LOAN_REJECTED,
                metadata: {
                    approver: admin_id,
                    remark: remark,
                },
                LoanId: loanId
            }, { transaction: t });

            await t.commit();
            return loan;
        } catch (error) {
            await t.rollback();
            throw error;
        }
    }

    async repayLoan(loanId: string, amount: number) {
        const t: Transaction = await sequelize.transaction();
        try {
            const loan = await Loan.findByPk(loanId, { transaction: t });
            
            if (!loan) {
                throw new CustomError('Loan not found!', HttpStatusCodes.BAD_REQUEST)
            }

            if (loan.getDataValue('status') !== LoanStatus.APPROVED) {
                throw new CustomError('Loan is not open for repayment!', HttpStatusCodes.BAD_REQUEST)
            }

            if (amount > parseFloat(loan.getDataValue("remainingAmount"))) {
                throw new CustomError('Repayment amount exceeds the remaining loan amount', HttpStatusCodes.BAD_REQUEST)
            }

            const pendingRepayments: any = await RepaymentSchedule.findOne({
                where: {
                    LoanId: loanId,
                    status: {
                        [Op.in]: [
                            RepaymentScheduleStatus.APPROVED, 
                            RepaymentScheduleStatus.DEFAULTED
                        ]
                    }
                },
                order: [['paymentDate', 'ASC']],
                transaction: t
            });

            if (!pendingRepayments) {
                throw new CustomError('No pending repayment schedules found', HttpStatusCodes.BAD_REQUEST)
            }

            if (amount < parseFloat(pendingRepayments.getDataValue("totalAmount"))) {
                throw new CustomError('Amount is less than the next repayment schedule amount', HttpStatusCodes.BAD_REQUEST)
            }

            let remainingRepaymentAmount = amount;
            const firstSchedule = pendingRepayments;
            if (remainingRepaymentAmount >= parseFloat(firstSchedule.totalAmount)) {
                remainingRepaymentAmount -= parseFloat(firstSchedule.totalAmount);
                await firstSchedule.update({ status: RepaymentScheduleStatus.PAID }, { transaction: t });
                await RepaymentActivity.create({
                    activity: RepaymentActivityType.PAYMENT_MADE,
                    metadata: { 
                        amount, 
                        scheduleId: firstSchedule.getDataValue("id") 
                    },
                    LoanId: loanId
                }, { transaction: t });
            }

            const newRemainingAmount = parseFloat(loan.getDataValue("remainingAmount")) - amount;
            await loan.update({ 
                remainingAmount: newRemainingAmount,
                lastPaymentDate: new Date()
            }, { transaction: t });

            await LoanActivity.create({
                activity: LoanActivityType.REPAYMENT_DONE,
                metadata: { amount },
                LoanId: loanId
            }, { transaction: t });

            if (remainingRepaymentAmount > 0 && newRemainingAmount > 0) {
                const remainingSchedules = await RepaymentSchedule.findAll({
                    where: {
                        LoanId: loanId,
                        status: RepaymentScheduleStatus.APPROVED
                    },
                    order: [['paymentDate', 'ASC']],
                    transaction: t
                });
    
                if (remainingSchedules.length > 0) {
                    const rebalanceAmount = (newRemainingAmount) / remainingSchedules.length;
                    for (let schedule of remainingSchedules) {
                        await schedule.update({ 
                            totalAmount: rebalanceAmount 
                        }, { transaction: t });
                    }
                    await RepaymentActivity.create({
                        activity: RepaymentActivityType.SCHEDULE_UPDATED,
                        metadata: { 
                            amount: rebalanceAmount, 
                            scheduleId: firstSchedule.getDataValue("id") 
                        },
                        LoanId: loanId
                    }, { transaction: t });
                }
            } 
            
            if (newRemainingAmount == 0) {
                // If there is no remaining amount, close the loan
                await loan.update({ 
                    status: LoanStatus.PAID,
                    closingDate: new Date()
                }, { transaction: t });
                await LoanActivity.create({
                    activity: LoanActivityType.LOAN_CLOSED,
                    LoanId: loanId
                }, { transaction: t });
            }            

            await t.commit();
            return loan;
        } catch (error) {
            await t.rollback();
            throw error;
        }
    }

    async defaultRepayments(): Promise<number> {
        const transaction = await sequelize.transaction();
        try {

            // Find all approved repayment schedules with past payment dates
            const repaymentSchedules = await RepaymentSchedule.findAll({
                where: {
                    status: RepaymentScheduleStatus.APPROVED,
                    paymentDate: {
                        [Op.lt]: new Date()
                    }
                },
                transaction
            });

            // Get unique loan IDs from the repayment schedules
            const loanIds = [...new Set(repaymentSchedules.map((schedule: any) => schedule.LoanId))];

            // Update repayment schedules to 'DEFAULTED'
            const updatePromises = repaymentSchedules.map(schedule =>
                schedule.update({ status: RepaymentScheduleStatus.DEFAULTED }, { transaction })
            );

            await Promise.all(updatePromises);

            // Add repayment activities
            const repaymentActivityPromises = repaymentSchedules.map((schedule: any) =>
                RepaymentActivity.create({
                    activity: RepaymentActivityType.DEFAULTED,
                    LoanId: schedule.LoanId,
                    metadata: {
                        scheduleId: schedule.id,
                        defaultDate: new Date(),
                    }
                }, { transaction })
            );

            await Promise.all(repaymentActivityPromises);

            // Add loan activities for each unique loan ID
            const loanActivityPromises = loanIds.map(loanId =>
                LoanActivity.create({
                    LoanId: loanId,
                    activity: LoanActivityType.DEFAULTED,
                    metadata: {
                        defaultDate: new Date(),
                    }
                }, { transaction })
            );

            await Promise.all(loanActivityPromises);

            // Commit the transaction
            await transaction.commit();
            return loanIds.length;
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

}