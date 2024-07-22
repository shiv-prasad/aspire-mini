import request from 'supertest';
import app from '../../src/app';
import { sequelize } from '../../src/config/database';
import { User } from '../../src/models/user';
import { UserRole } from '../../src/enums/user';
import { LoanStatus, LoanTermType, RepaymentScheduleStatus } from '../../src/enums/loan';
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
});

afterAll(async () => {
    await sequelize.close();
});

describe('CustomerController - RequestLoan', () => {
    
    test("Unauthorized when Customer User not given", async () => {
        const response = await request(app)
            .post('/customer/request-loan')
        expect(response.status).toBe(401);
    });

    test("Unauthorized when User is not found User not given", async () => {
        const response = await request(app)
            .post('/customer/request-loan')
            .set('username', 'faketestuser')
        expect(response.status).toBe(401);
    });

    test("Unauthorized when User is not customer", async () => {
        const response = await request(app)
            .post('/customer/request-loan')
            .set('username', 'adminuser')
        expect(response.status).toBe(401);
    });

    test("Bad Request when payload is not given", async () => {
        const response = await request(app)
            .post('/customer/request-loan')
            .set('username', 'testuser')
        expect(response.status).toBe(400);
    });

    test("Bad Request when payload is empty", async () => {
        const response = await request(app)
            .post('/customer/request-loan')
            .set('username', 'testuser')
            .send({})
        expect(response.status).toBe(400);
    });

    test("Bad Request when amount is missing", async () => {
        const response = await request(app)
            .post('/customer/request-loan')
            .set('username', 'testuser')
            .send({
                terms: 3
            })
        expect(response.status).toBe(400);
    });

    test("Bad Request when terms is missing", async () => {
        const response = await request(app)
            .post('/customer/request-loan')
            .set('username', 'testuser')
            .send({
                amount: 3000
            })
        expect(response.status).toBe(400);
    });

    test("Bad Request when amount is invalid", async () => {
        await request(app)
            .post('/customer/request-loan')
            .set('username', 'testuser')
            .send({
                amount: "test",
                terms: 3
            }).expect(400)
        await request(app)
            .post('/customer/request-loan')
            .set('username', 'testuser')
            .send({
                amount: -5,
                terms: 3
            }).expect(400)
        await request(app)
            .post('/customer/request-loan')
            .set('username', 'testuser')
            .send({
                amount: 0,
                terms: 3
            }).expect(400)
    });

    test("Bad Request when terms is invalid", async () => {
        await request(app)
            .post('/customer/request-loan')
            .set('username', 'testuser')
            .send({
                amount: 3000,
                terms: "test"
            }).expect(400)
        await request(app)
            .post('/customer/request-loan')
            .set('username', 'testuser')
            .send({
                amount: 3000,
                terms: -1
            }).expect(400)
        await request(app)
            .post('/customer/request-loan')
            .set('username', 'testuser')
            .send({
                amount: 3000,
                terms: 0
            }).expect(400)
    });

    test("Bad Request when termType is invalid", async () => {
        await request(app)
            .post('/customer/request-loan')
            .set('username', 'testuser')
            .send({
                amount: 3000,
                terms: 1,
                termType: 'test'
            }).expect(400)
    });

    test("Success when no term type is given", async () => {
        const response = await request(app)
            .post('/customer/request-loan')
            .set('username', 'testuser')
            .send({
                amount: 3000,
                terms: 3
            })
        expect(response.status).toBe(200);
        expect(response.body.totalAmount).toBe(3000);
        expect(response.body.status).toBe(LoanStatus.PENDING);
        expect(response.body.status).toBe(LoanStatus.PENDING);
        expect(response.body.totalTerms).toBe(3);
        expect(response.body.termType).toBe(LoanTermType.WEEKLY);
        expect(response.body.remainingAmount).toBe(3000);
    });

    test("Success when weekly term type is given", async () => {
        const response = await request(app)
            .post('/customer/request-loan')
            .set('username', 'testuser')
            .send({
                amount: 3000,
                terms: 3,
                termType: LoanTermType.WEEKLY
            })
        expect(response.status).toBe(200);
        expect(response.body.totalAmount).toBe(3000);
        expect(response.body.status).toBe(LoanStatus.PENDING);
        expect(response.body.totalTerms).toBe(3);
        expect(response.body.termType).toBe(LoanTermType.WEEKLY);
        expect(response.body.remainingAmount).toBe(3000);

        const repaymentSchedules = await RepaymentSchedule.findAll({ where: { LoanId: response.body.id } });
        expect(repaymentSchedules.length).toBe(3);
        repaymentSchedules.forEach((schedule: any) => {
            expect(schedule.status).toBe(RepaymentScheduleStatus.PENDING)
        });
    });

    test("Success when monthly term type is given", async () => {
        const response = await request(app)
            .post('/customer/request-loan')
            .set('username', 'testuser')
            .send({
                amount: 3000,
                terms: 3,
                termType: LoanTermType.MONTHLY
            })
        expect(response.status).toBe(200);
        expect(response.body.totalAmount).toBe(3000);
        expect(response.body.status).toBe(LoanStatus.PENDING);
        expect(response.body.totalTerms).toBe(3);
        expect(response.body.termType).toBe(LoanTermType.MONTHLY);
        expect(response.body.remainingAmount).toBe(3000);

        const repaymentSchedules = await RepaymentSchedule.findAll({ where: { LoanId: response.body.id } });
        expect(repaymentSchedules.length).toBe(3);
        repaymentSchedules.forEach((schedule: any) => {
            expect(schedule.status).toBe(RepaymentScheduleStatus.PENDING)
        });

    });

})