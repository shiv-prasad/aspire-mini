import request from 'supertest';
import app from '../../src/app';
import { sequelize } from '../../src/config/database';
import { User } from '../../src/models/user';
import { UserRole } from '../../src/enums/user';
import { Loan } from '../../src/models/loan';
import { RepaymentSchedule } from '../../src/models/repaymentSchedule';
import { RepaymentScheduleStatus } from '../../src/enums/loan';

beforeAll(async () => {
    await sequelize.sync({ force: true });
    const currentDate = new Date();
    await User.create({
        id: 1,
        firstName: 'cron',
        lastName: 'user',
        username: 'cronuser',
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
        lastName: 'user two',
        username: 'testusertwo',
        role: UserRole.CUSTOMER 
    });
    await Loan.create({
        id: 1,
        totalAmount: 1000,
        totalTerms: 4,
        remainingAmount: 1000,
        UserId: 2
    });
    await RepaymentSchedule.create({
        LoanId: 1,
        totalAmount: 500,
        status: RepaymentScheduleStatus.PAID,
        paymentDate: (currentDate.getDate() - 14)
    })
    await RepaymentSchedule.create({
        LoanId: 1,
        totalAmount: 300,
        status: RepaymentScheduleStatus.APPROVED,
        paymentDate: (currentDate.getDate() - 7)
    })
    await RepaymentSchedule.create({
        LoanId: 1,
        totalAmount: 400,
        status: RepaymentScheduleStatus.APPROVED,
        paymentDate: (currentDate.getDate() - 2)
    })
    await RepaymentSchedule.create({
        LoanId: 1,
        totalAmount: 200,
        status: RepaymentScheduleStatus.APPROVED,
        paymentDate: (currentDate.getDate() + 7)
    })

    await Loan.create({
        id: 2,
        totalAmount: 800,
        totalTerms: 2,
        remainingAmount: 800,
        UserId: 3
    });
    await RepaymentSchedule.create({
        LoanId: 2,
        totalAmount: 500,
        status: RepaymentScheduleStatus.APPROVED,
        paymentDate: (currentDate.getDate() - 2)
    })
    await RepaymentSchedule.create({
        LoanId: 2,
        totalAmount: 300,
        status: RepaymentScheduleStatus.APPROVED,
        paymentDate: (currentDate.getDate() + 7)
    })

    await Loan.create({
        id: 3,
        totalAmount: 800,
        totalTerms: 2,
        remainingAmount: 800,
        UserId: 3
    });
    await RepaymentSchedule.create({
        LoanId: 3,
        totalAmount: 500,
        status: RepaymentScheduleStatus.APPROVED,
        paymentDate: (currentDate.getDate() + 14)
    })
    await RepaymentSchedule.create({
        LoanId: 3,
        totalAmount: 300,
        status: RepaymentScheduleStatus.APPROVED,
        paymentDate: (currentDate.getDate() + 21)
    })
    
});

afterAll(async () => {
    await sequelize.close();
});

describe('JobsController - Check for loan payments', () => {
    
    test("Unauthorized when Username not given", async () => {
        const response = await request(app)
            .post(`/jobs/check-for-late-payments`)
        expect(response.status).toBe(401);
    });

    test("Unauthorized when No User is found", async () => {
        const response = await request(app)
            .post(`/jobs/check-for-late-payments`)
            .set('username', 'testadminuser')
        expect(response.status).toBe(401);
    });

    test("Unauthorized when User is not Admin", async () => {
        await request(app)
            .post(`/jobs/check-for-late-payments`)
            .set('username', 'testuser')
            .expect(401)
        await request(app)
            .post(`/jobs/check-for-late-payments`)
            .set('username', 'testusertwo')
            .expect(401)
    });

    test("Success Check", async () => {
        const response = await request(app)
            .post(`/jobs/check-for-late-payments`)
            .set('username', 'cronuser')
        
        expect(response.status).toBe(200);
        expect(response.body.totalLoansDefaulted).toBe(2);

        const defaultedSchedules = await RepaymentSchedule.findAll({ 
            where: { status: RepaymentScheduleStatus.DEFAULTED}, 
            order: [
                ['LoanId', 'ASC']
            ]
        })

        expect(defaultedSchedules.length).toBe(3);
        expect(defaultedSchedules[0].getDataValue('loanId')).toBe(1)
        expect(defaultedSchedules[0].getDataValue('totalAmount')).toBe(300)
        expect(defaultedSchedules[1].getDataValue('loanId')).toBe(1)
        expect(defaultedSchedules[1].getDataValue('totalAmount')).toBe(400)
        expect(defaultedSchedules[2].getDataValue('loanId')).toBe(2)
        expect(defaultedSchedules[2].getDataValue('totalAmount')).toBe(500)

    });

    
})