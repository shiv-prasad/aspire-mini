import request from 'supertest';
import app from '../../src/app';
import { sequelize } from '../../src/config/database';
import { User } from '../../src/models/user';
import { UserRole } from '../../src/enums/user';
import { LoanStatus, RepaymentScheduleStatus } from '../../src/enums/loan';
import { Loan } from '../../src/models/loan';
import { RepaymentSchedule } from '../../src/models/repaymentSchedule';

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
    await Loan.create({
        id: 1,
        totalAmount: 1000,
        status: LoanStatus.PENDING,
        totalTerms: 2,
        remainingAmount: 1000,
        UserId: 2
    });
    await RepaymentSchedule.create({
        id: 1,
        LoanId: 1,
        totalAmount: 500,
        status: RepaymentScheduleStatus.PENDING,
    })
    await RepaymentSchedule.create({
        id: 2,
        LoanId: 1,
        totalAmount: 500,
        status: RepaymentScheduleStatus.PENDING,
    })
    await Loan.create({
        id: 2,
        totalAmount: 1000,
        status: LoanStatus.PENDING,
        totalTerms: 2,
        remainingAmount: 1000,
        UserId: 2
    });
    await RepaymentSchedule.create({
        id: 3,
        LoanId: 2,
        totalAmount: 500,
        status: RepaymentScheduleStatus.PENDING,
    })
    await RepaymentSchedule.create({
        id: 4,
        LoanId: 2,
        totalAmount: 500,
        status: RepaymentScheduleStatus.PENDING,
    })
    await Loan.create({
        id: 3,
        totalAmount: 1000,
        status: LoanStatus.APPROVED,
        totalTerms: 2,
        remainingAmount: 1000,
        UserId: 2
    });
    await Loan.create({
        id: 4,
        totalAmount: 1000,
        status: LoanStatus.REJECTED,
        totalTerms: 2,
        remainingAmount: 1000,
        UserId: 2
    });
    await Loan.create({
        id: 5,
        totalAmount: 1000,
        status: LoanStatus.PAID,
        totalTerms: 2,
        remainingAmount: 0,
        UserId: 2
    })
});

afterAll(async () => {
    await sequelize.close();
});

describe('AdminController - verifyLoan', () => {
    
    test("Unauthorized when Admin User not given", async () => {
        const response = await request(app)
            .post('/admin/verify-loan')
            .send({
                loanId: 1,
                status: LoanStatus.APPROVED,
                remark: 'test remark'
            });
        expect(response.status).toBe(401);
    });

    test("Unauthorized when No User is found", async () => {
        const response = await request(app)
            .post('/admin/verify-loan')
            .set('username', 'testadminuser')
            .send({
                loanId: 1,
                status: LoanStatus.APPROVED,
                remark: 'test remark'
            });
        expect(response.status).toBe(401);
    });

    test("Bad Request when Invalid status Passed - PENDING", async () => {
        const response = await request(app)
            .post('/admin/verify-loan')
            .set('username', 'adminuser')
            .send({
                loanId: 1,
                status: LoanStatus.PENDING,
                remark: 'test remark'
            });
        expect(response.status).toBe(400);
    });

    test("Bad Request when Invalid status Passed - PAID", async () => {
        const response = await request(app)
            .post('/admin/verify-loan')
            .set('username', 'adminuser')
            .send({
                loanId: 1,
                status: LoanStatus.PAID,
                remark: 'test remark'
            });
        expect(response.status).toBe(400);
    });

    test("Bad Request when Loan Id Not Present", async () => {
        const response = await request(app)
            .post('/admin/verify-loan')
            .set('username', 'adminuser')
            .send({
                loanId: 100,
                status: LoanStatus.APPROVED,
                remark: 'test remark'
            });
        expect(response.status).toBe(400);
    });

    test("Bad Request when Loan Status not Pending", async () => {
        const response = await request(app)
            .post('/admin/verify-loan')
            .set('username', 'adminuser')
            .send({
                loanId: 3,
                status: LoanStatus.APPROVED,
                remark: 'test remark'
            });
        expect(response.status).toBe(400);
    });

    test("Success - Approved", async () => {
        const response = await request(app)
            .post('/admin/verify-loan')
            .set('username', 'adminuser')
            .send({
                loanId: 1,
                status: LoanStatus.APPROVED,
                remark: 'test remark'
            });
        expect(response.status).toBe(200)
        expect(response.body.status).toBe(LoanStatus.APPROVED);

        const schedules = await RepaymentSchedule.findAll({where: {LoanId: 1}})
        schedules.forEach((schedule: any) => {
            expect(schedule.status).toBe(LoanStatus.APPROVED);
        })
    });

    test("Success - Rejected", async () => {
        const response = await request(app)
            .post('/admin/verify-loan')
            .set('username', 'adminuser')
            .send({
                loanId: 2,
                status: LoanStatus.REJECTED,
                remark: 'test remark'
            });
        expect(response.status).toBe(200)
        expect(response.body.status).toBe(LoanStatus.REJECTED);

        const schedules = await RepaymentSchedule.findAll({where: {LoanId: 2}})
        schedules.forEach((schedule: any) => {
            expect(schedule.status).toBe(RepaymentScheduleStatus.REJECTED);
        })
    });

})