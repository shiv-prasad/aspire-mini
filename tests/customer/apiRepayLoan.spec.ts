import request from 'supertest';
import app from '../../src/app';
import { sequelize } from '../../src/config/database';
import { User } from '../../src/models/user';
import { UserRole } from '../../src/enums/user';
import { LoanStatus, LoanTermType, RepaymentScheduleStatus } from '../../src/enums/loan';
import { RepaymentSchedule } from '../../src/models/repaymentSchedule';
import { Loan } from '../../src/models/loan';

async function createLoan(
    totalAmount: number, 
    remainingAmount: number, 
    totalTerms: number, 
    userId: number, 
    status: LoanStatus,
    createRepaymentSchedule: boolean = true
) {
    const loan = await Loan.create({
        UserId: userId,
        totalAmount: totalAmount,
        totalTerms: totalTerms,
        status: status,
        remainingAmount: remainingAmount
    })
    if (createRepaymentSchedule) {
        const termDuration = 7; // Weekly Term
        const installmentAmount = totalAmount / totalTerms;
        for (let i = 0; i < totalTerms; i++) {
            const paymentDate = new Date();
            paymentDate.setDate(paymentDate.getDate() + (i + 1) * termDuration);
            await RepaymentSchedule.create({
                LoanId: loan.getDataValue('id'),
                totalAmount: installmentAmount,
                paymentDate,
                status: status,
            })
        }
    }
    return loan.getDataValue('id')
}

beforeAll(async () => {
    await sequelize.sync({ force: true });

    await User.create({
        id: 1,
        firstName: 'admin',
        lastName: 'user',
        username: 'adminuser',
        role: UserRole.ADMIN 
    });
    await User.create({
        id: 2,
        firstName: 'test',
        lastName: 'user',
        username: 'testuser',
        role: UserRole.CUSTOMER 
    });
    await User.create({
        id: 3,
        firstName: 'test',
        lastName: 'user',
        username: 'testuserone',
        role: UserRole.CUSTOMER 
    });
});

afterAll(async () => {
    await sequelize.close();
});

describe('CustomerController - RepayLoan', () => {
    
    test("Unauthorized when Customer User not given", async () => {
        const response = await request(app)
            .post('/customer/repay-loan')
            .send({
                loanId: 1,
                amount: 100
            })
        expect(response.status).toBe(401);
    });

    test("Unauthorized when User is not found User not given", async () => {
        const response = await request(app)
            .post('/customer/repay-loan')
            .set('username', 'faketestuser')
            .send({
                loanId: 1,
                amount: 100
            })
        expect(response.status).toBe(401);
    });

    test("Unauthorized when User is not customer", async () => {
        const response = await request(app)
            .post('/customer/repay-loan')
            .set('username', 'adminuser')
            .send({
                loanId: 1,
                amount: 100
            })
        expect(response.status).toBe(401);
    });

    test("Bad Request when payload is not given", async () => {
        const response = await request(app)
            .post('/customer/repay-loan')
            .set('username', 'testuser')
        expect(response.status).toBe(400);
    });

    test("Bad Request when payload is empty", async () => {
        const response = await request(app)
            .post('/customer/repay-loan')
            .set('username', 'testuser')
            .send({})
        expect(response.status).toBe(400);
    });

    test("Bad Request when amount is missing", async () => {
        const response = await request(app)
            .post('/customer/repay-loan')
            .set('username', 'testuser')
            .send({
                loanId: 1
            })
        expect(response.status).toBe(400);
    });

    test("Bad Request when loanId is missing", async () => {
        const response = await request(app)
            .post('/customer/repay-loan')
            .set('username', 'testuser')
            .send({
                amount: 3000
            })
        expect(response.status).toBe(400);
    });

    test("Bad Request when repaying for loan of different user", async () => {
        const loanId = await createLoan(1000, 1000, 2, 3, LoanStatus.APPROVED);
        const response = await request(app)
            .post('/customer/repay-loan')
            .set('username', 'testuser')
            .send({
                loanId: loanId,
                amount: 3000
            })
        expect(response.status).toBe(401);
    })

    test("Bad Request when repaying for loan not found", async () => {
        await createLoan(1000, 1000, 2, 2, LoanStatus.APPROVED);
        const response = await request(app)
            .post('/customer/repay-loan')
            .set('username', 'testuser')
            .send({
                loanId: 100,
                amount: 3000
            })
        expect(response.status).toBe(400);
    })

    test("Bad Request when repaying for loan which is not approved - Current Status: PENDING", async () => {
        const loanId = await createLoan(1000, 1000, 2, 2, LoanStatus.PENDING);
        const response = await request(app)
            .post('/customer/repay-loan')
            .set('username', 'testuser')
            .send({
                loanId: loanId,
                amount: 3000
            })
        expect(response.status).toBe(400);
    })

    test("Bad Request when repaying for loan which is not approved - Current Status: REJECTED", async () => {
        const loanId = await createLoan(1000, 1000, 2, 2, LoanStatus.REJECTED);
        const response = await request(app)
            .post('/customer/repay-loan')
            .set('username', 'testuser')
            .send({
                loanId: loanId,
                amount: 3000
            })
        expect(response.status).toBe(400);
    })

    test("Bad Request when repaying for loan which is not approved - Current Status: PAID", async () => {
        const loanId = await createLoan(1000, 1000, 2, 2, LoanStatus.PAID);
        const response = await request(app)
            .post('/customer/repay-loan')
            .set('username', 'testuser')
            .send({
                loanId: loanId,
                amount: 3000
            })
        expect(response.status).toBe(400);
    })

    test("Bad Request when repaying for loan with amount > remaining amount", async () => {
        const loanId = await createLoan(1000, 1000, 2, 2, LoanStatus.APPROVED);
        const response = await request(app)
            .post('/customer/repay-loan')
            .set('username', 'testuser')
            .send({
                loanId: loanId,
                amount: 3000
            })
        expect(response.status).toBe(400);
    })

    test("Bad Request when repaying for loan with no approved repayment schedule", async () => {
        const loanId = await createLoan(1000, 1000, 2, 2, LoanStatus.APPROVED, false);
        const response = await request(app)
            .post('/customer/repay-loan')
            .set('username', 'testuser')
            .send({
                loanId: loanId,
                amount: 700
            })
        expect(response.status).toBe(400);
    })

    test("Bad Request when repaying for loan with amount < next repayment schedule amount", async () => {
        const loanId = await createLoan(1000, 1000, 2, 2, LoanStatus.APPROVED);
        const response = await request(app)
            .post('/customer/repay-loan')
            .set('username', 'testuser')
            .send({
                loanId: loanId,
                amount: 400
            })
        expect(response.status).toBe(400);
    })

    test("Success - Repaying with amount > next repayment amount", async () => {
        const loanId = await createLoan(1000, 1000, 2, 2, LoanStatus.APPROVED);
        const response = await request(app)
            .post('/customer/repay-loan')
            .set('username', 'testuser')
            .send({
                loanId: loanId,
                amount: 600
            })
        expect(response.status).toBe(200);
        expect(response.body.remainingAmount).toBe(400);
        expect(response.body.status).toBe(LoanStatus.APPROVED);

        const repaymentSchedules = await RepaymentSchedule.findAll({where: {LoanId: loanId}})
        expect(repaymentSchedules.length).toBe(2);
        expect(repaymentSchedules[0].getDataValue('status')).toBe(RepaymentScheduleStatus.PAID)
        expect(repaymentSchedules[0].getDataValue('totalAmount')).toBe(500)
        expect(repaymentSchedules[1].getDataValue('status')).toBe(RepaymentScheduleStatus.APPROVED)
        expect(repaymentSchedules[1].getDataValue('totalAmount')).toBe(400)
    });

    test("Success - First Repayment with amount == total remaining amount", async () => {
        const loanId = await createLoan(1000, 1000, 2, 2, LoanStatus.APPROVED);
        const response = await request(app)
            .post('/customer/repay-loan')
            .set('username', 'testuser')
            .send({
                loanId: loanId,
                amount: 1000
            })
        expect(response.status).toBe(200);
        expect(response.body.remainingAmount).toBe(0);
        expect(response.body.status).toBe(LoanStatus.PAID);

        const repaymentSchedules = await RepaymentSchedule.findAll({where: {LoanId: loanId}})
        expect(repaymentSchedules.length).toBe(2);
        expect(repaymentSchedules[0].getDataValue('status')).toBe(RepaymentScheduleStatus.PAID)
        expect(repaymentSchedules[0].getDataValue('totalAmount')).toBe(500)
        expect(repaymentSchedules[1].getDataValue('status')).toBe(RepaymentScheduleStatus.APPROVED)
        expect(repaymentSchedules[1].getDataValue('totalAmount')).toBe(0)
    });

    test("Success - Finish Repayment Soon", async () => {
        const loanId = await createLoan(1500, 1500, 3, 2, LoanStatus.APPROVED);

        // Payment 1 / 3
        let response = await request(app)
            .post('/customer/repay-loan')
            .set('username', 'testuser')
            .send({
                loanId: loanId,
                amount: 500
            })
        expect(response.status).toBe(200);
        expect(response.body.remainingAmount).toBe(1000);
        expect(response.body.status).toBe(LoanStatus.APPROVED);

        let repaymentSchedules = await RepaymentSchedule.findAll({where: {LoanId: loanId}})
        expect(repaymentSchedules.length).toBe(3);
        expect(repaymentSchedules[0].getDataValue('status')).toBe(RepaymentScheduleStatus.PAID)
        expect(repaymentSchedules[0].getDataValue('totalAmount')).toBe(500)
        expect(repaymentSchedules[1].getDataValue('status')).toBe(RepaymentScheduleStatus.APPROVED)
        expect(repaymentSchedules[1].getDataValue('totalAmount')).toBe(500)
        expect(repaymentSchedules[2].getDataValue('status')).toBe(RepaymentScheduleStatus.APPROVED)
        expect(repaymentSchedules[2].getDataValue('totalAmount')).toBe(500)

        // Payment 2 / 3
        response = await request(app)
            .post('/customer/repay-loan')
            .set('username', 'testuser')
            .send({
                loanId: loanId,
                amount: 1000
            })
        expect(response.status).toBe(200);
        expect(response.body.remainingAmount).toBe(0);
        expect(response.body.status).toBe(LoanStatus.PAID);

        repaymentSchedules = await RepaymentSchedule.findAll({where: {LoanId: loanId}})
        expect(repaymentSchedules.length).toBe(3);
        expect(repaymentSchedules[0].getDataValue('status')).toBe(RepaymentScheduleStatus.PAID)
        expect(repaymentSchedules[0].getDataValue('totalAmount')).toBe(500)
        expect(repaymentSchedules[1].getDataValue('status')).toBe(RepaymentScheduleStatus.PAID)
        expect(repaymentSchedules[1].getDataValue('totalAmount')).toBe(500)
        expect(repaymentSchedules[2].getDataValue('status')).toBe(RepaymentScheduleStatus.APPROVED)
        expect(repaymentSchedules[2].getDataValue('totalAmount')).toBe(0)
    });

    test("Success - Repayment for Defaulted Loan", async () => {
        const loanId = await createLoan(1000, 1000, 2, 2, LoanStatus.APPROVED);
        let repaymentSchedules = await RepaymentSchedule.findAll({where: {LoanId: loanId}})
        repaymentSchedules[0].update({
            status: RepaymentScheduleStatus.DEFAULTED
        })
        const response = await request(app)
            .post('/customer/repay-loan')
            .set('username', 'testuser')
            .send({
                loanId: loanId,
                amount: 1000
            })
        expect(response.status).toBe(200);
        expect(response.body.remainingAmount).toBe(0);
        expect(response.body.status).toBe(LoanStatus.PAID);

        repaymentSchedules = await RepaymentSchedule.findAll({where: {LoanId: loanId}})
        expect(repaymentSchedules.length).toBe(2);
        expect(repaymentSchedules[0].getDataValue('status')).toBe(RepaymentScheduleStatus.PAID)
        expect(repaymentSchedules[0].getDataValue('totalAmount')).toBe(500)
        expect(repaymentSchedules[1].getDataValue('status')).toBe(RepaymentScheduleStatus.APPROVED)
        expect(repaymentSchedules[1].getDataValue('totalAmount')).toBe(0)
    });

})