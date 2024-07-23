import { Model, Transaction, Op } from "sequelize";
import { CustomError } from "../../classes/customError";
import { ValidationError } from "../../classes/validationError";
import { sequelize } from "../../config/database";
import { LoanActivityType, LoanStatus, LoanTermType, RepaymentActivityType, RepaymentScheduleStatus } from "../../enums/loan";
import { Loan } from "../../models/loan";
import { LoanActivity } from "../../models/loanActivity";
import { RepaymentActivity } from "../../models/repaymentActivity";
import { RepaymentSchedule } from "../../models/repaymentSchedule";

/**
 * DB Handler for Loan, RepaymentSchedule, RepaymentActivity and Loan Activity Models
 */
export default class LoanDB {

    /**
     * Get all the loans from db
     * Also include Attached Loan Activities, Repayment Schedules and Repayment Activities
     * Order Sequence for Loans: APPROVED loans will be showed first followed by PAID, PENDING and REJECTED
     * @param extraFilters 
     * @returns 
     */
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

    /**
     * Get loan info for the specified loan Id
     * Also include Attached Loan Activities, Repayment Schedules and Repayment Activities
     * @param loanId 
     * @returns 
     */
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

    /**
     * Returns Repayment Schedule for the specified loan
     * Order by payment date
     * @param loanId 
     * @returns 
     */
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

    /**
     * Returns All the loan Activities for the specified loan
     * Order by activity timestamp
     * @param loanId 
     * @returns 
     */
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

    /**
     * Returns All the Repayment Activities for the specified loan
     * Order by activity timestamp
     * @param loanId 
     * @returns 
     */
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

    /**
     * Creates a new loan and add the repayment schedules for the loan
     * 
     * Loan Activities: REQUEST_CREATED
     * Repayment Activities: SCHEDULE_CREATED
     * 
     * @param loanAmount 
     * @param totalTerms 
     * @param loanTermType 
     * @param customer_id 
     * @returns 
     */
    async createLoan(
        loanAmount: number,
        totalTerms: number,
        loanTermType: LoanTermType,
        customer_id: string
    ): Promise<Model<any, any>> {
        // Using transaction to ensure, any failure to be rolled back
        const t: Transaction = await sequelize.transaction({ isolationLevel: Transaction.ISOLATION_LEVELS.SERIALIZABLE });
        try {
            // Create the loan with the specified details and add user to loan
            const loan = await Loan.create({
                totalAmount: loanAmount,
                remainingAmount: loanAmount,
                totalTerms: totalTerms,
                termType: loanTermType,
                UserId: customer_id,
            }, { transaction: t });

            // Create a new activity (REQUEST_CREATED) for the loan
            await LoanActivity.create({
                LoanId: loan.getDataValue('id'),
                activity: LoanActivityType.REQUEST_CREATED,
                metadata: {
                    amount: loanAmount,
                    totalTerms: totalTerms,
                },
            }, { transaction: t });

            // Create Repayment Schedules for the loan
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

            // // Create a new activity (SCHEDULE_CREATED) for the repayment of loan
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

    /**
     * Verify a loan to either approved or rejected
     * Does basic validation of loan to be present and should be in PENDING state
     * 
     * Updates both Loan and Repayment Schedule to be APPROVED / REJECTED
     * 
     * Final Loan Status: APPROVED / REJECTED
     * Loan Activity Generated: LOAN_APPROVED / LOAN_REJECTED
     * @param loanId 
     * @param status 
     * @param remark 
     * @param admin_id 
     * @returns 
     */
    async verifyLoan(loanId: number, status: LoanStatus, remark: string, admin_id: number): Promise<Model<any, any>> {
        // Using transaction to ensure, any failure to be rolled back
        const t: Transaction = await sequelize.transaction({ isolationLevel: Transaction.ISOLATION_LEVELS.SERIALIZABLE });
        try {

            // Check if a loan exists or not
            const loan = await Loan.findByPk(loanId, { transaction: t });
            if (!loan) {
                throw new ValidationError('Loan not found!')
            }

            // Loan should be in pending state to proceed
            if (loan.getDataValue('status') !== LoanStatus.PENDING) {
                throw new ValidationError('Loan is not open for verification!')
            }

            // Update Loan and Repayment Status to be Approved / Rejected
            await loan.update({ status: status }, { transaction: t });
            await RepaymentSchedule.update(
                { status: status },
                { where: { LoanId: loanId }, transaction: t },
            );

            // Based on status of loan, create Loan Activity
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

    /**
     * Repay the loan with the specified amount
     * Does basic validation of loan to be present and should be in APPROVED state
     * We can repay a loan only when the amount is less than or equal to the remaining amount 
     * and greater than or equal to the next repayment amount
     * 
     * New Loan Status (PAID : If no remaining amount left) else APPROVED
     * 
     * New Repayment Activity: PAYMENT_MADE
     * New Loan Activity: REPAYMENT_DONE, LOAN_CLOSED (If no remaining amount left)
     * @param loanId 
     * @param amount 
     * @returns 
     */
    async repayLoan(loanId: string, amount: number) {
        // Using transaction to ensure, any failure to be rolled back
        const t: Transaction = await sequelize.transaction({ isolationLevel: Transaction.ISOLATION_LEVELS.SERIALIZABLE });
        try {

            // Check if loan exists and status is APPROVED
            const loan = await Loan.findByPk(loanId, { transaction: t });
            if (!loan) {
                throw new ValidationError('Loan not found!')
            }
            if (loan.getDataValue('status') !== LoanStatus.APPROVED) {
                throw new ValidationError('Loan is not open for repayment!')
            }

            // Amount should be less than or equal to the remaining amount
            if (amount > parseFloat(loan.getDataValue("remainingAmount"))) {
                throw new ValidationError('Repayment amount exceeds the remaining loan amount')
            }

            // Get the first repayment schedule
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
                throw new ValidationError('No pending repayment schedules found')
            }

            // Amount should be more than or equal to the amount for next repayment schedule
            if (amount < parseFloat(pendingRepayments.getDataValue("totalAmount"))) {
                throw new ValidationError('Amount is less than the next repayment schedule amount')
            }

            // Mark the first repayment schedule as paid and 
            // get the leftover amount to be carried forward to the next repayments
            let remainingRepaymentAmount = amount;
            const firstSchedule = pendingRepayments;
            if (remainingRepaymentAmount >= parseFloat(firstSchedule.totalAmount)) {
                remainingRepaymentAmount -= parseFloat(firstSchedule.totalAmount);
                await firstSchedule.update({ status: RepaymentScheduleStatus.PAID }, { transaction: t });
                // Create a repayment activity as PAYMENT_MAID
                await RepaymentActivity.create({
                    activity: RepaymentActivityType.PAYMENT_MADE,
                    metadata: {
                        amount,
                        scheduleId: firstSchedule.getDataValue("id")
                    },
                    LoanId: loanId
                }, { transaction: t });
            }

            // Update the loan with remaining amount and payment date
            const newRemainingAmount = parseFloat(loan.getDataValue("remainingAmount")) - amount;
            await loan.update({
                remainingAmount: newRemainingAmount,
                lastPaymentDate: new Date()
            }, { transaction: t });

            // Create a lon activity as REPAYMENT_DONE
            await LoanActivity.create({
                activity: LoanActivityType.REPAYMENT_DONE,
                metadata: { amount },
                LoanId: loanId
            }, { transaction: t });

            // If the remaining amount is paid completely, Mark the loan as Paid
            if (newRemainingAmount == 0) {
                await loan.update({
                    status: LoanStatus.PAID,
                    closingDate: new Date()
                }, { transaction: t });
                // Create a new loan activity as LOAN_CLOSED
                await LoanActivity.create({
                    activity: LoanActivityType.LOAN_CLOSED,
                    LoanId: loanId
                }, { transaction: t });
            }

            // If there is any remaining unpaid schedule, re-balance the schedules with remaining amount
            const remainingSchedules = await RepaymentSchedule.findAll({
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
            if (remainingSchedules.length > 0) {
                const rebalanceAmount = (newRemainingAmount) / remainingSchedules.length;
                for (let schedule of remainingSchedules) {
                    await schedule.update({
                        totalAmount: rebalanceAmount
                    }, { transaction: t });
                }
                // Create a new prepayment activity as SCHEDULE_UPDATED
                await RepaymentActivity.create({
                    activity: RepaymentActivityType.SCHEDULE_UPDATED,
                    metadata: {
                        rebalanceAmount,
                        scheduleId: firstSchedule.getDataValue("id")
                    },
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

    /**
     * Check for any repayment where due date is in past, mark them as DEFAULTED
     * 
     * New Repayment Activity for each loan: DEFAULTED
     * New Loan Activity for each loan: PAYMENT_MADE
     * @returns 
     */
    async defaultRepayments(): Promise<number> {
        // Using transaction to ensure, any failure to be rolled back
        const transaction: Transaction = await sequelize.transaction({ isolationLevel: Transaction.ISOLATION_LEVELS.SERIALIZABLE });
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

            // Add repayment activities for all Loans as DEFAULTED
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

            // Add loan activities as DEFAULTED for each unique loan ID
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

            await transaction.commit();
            return loanIds.length;
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

}