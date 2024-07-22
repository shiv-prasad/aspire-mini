import request from 'supertest';
import app from '../../src/app';
import { sequelize } from '../../src/config/database';
import { User } from '../../src/models/user';
import { UserRole } from '../../src/enums/user';
import { Loan } from '../../src/models/loan';
import { LoanActivityType, RepaymentActivityType } from '../../src/enums/loan';
import { LoanActivity } from '../../src/models/loanActivity';
import { RepaymentActivity } from '../../src/models/repaymentActivity';

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
        lastName: 'user two',
        username: 'testusertwo',
        role: UserRole.CUSTOMER 
    });
    await Loan.create({
        id: 1,
        totalAmount: 1000,
        totalTerms: 3,
        remainingAmount: 1000,
        UserId: 2
    });
    await RepaymentActivity.create({
        LoanId: 1,
        activity: RepaymentActivityType.SCHEDULE_CREATED
    })
    await RepaymentActivity.create({
        LoanId: 1,
        activity: RepaymentActivityType.PAYMENT_MADE
    })
    await RepaymentActivity.create({
        LoanId: 1,
        activity: RepaymentActivityType.SCHEDULE_UPDATED
    })
    await RepaymentActivity.create({
        LoanId: 1,
        activity: RepaymentActivityType.DEFAULTED
    })
    await RepaymentActivity.create({
        LoanId: 1,
        activity: RepaymentActivityType.PAYMENT_MADE
    })

    await Loan.create({
        id: 2,
        totalAmount: 1000,
        totalTerms: 3,
        remainingAmount: 1000,
        UserId: 3
    });
    await RepaymentActivity.create({
        LoanId: 2,
        activity: RepaymentActivityType.SCHEDULE_CREATED
    })
    await RepaymentActivity.create({
        LoanId: 2,
        activity: RepaymentActivityType.PAYMENT_MADE
    })
    await RepaymentActivity.create({
        LoanId: 2,
        activity: RepaymentActivityType.PAYMENT_MADE
    })
});

afterAll(async () => {
    await sequelize.close();
});

describe('ActivityController - LoanRepaymentActivity', () => {
    
    test("Unauthorized when Username not given", async () => {
        const response = await request(app)
            .get(`/activity/1/repayment`)
        expect(response.status).toBe(401);
    });

    test("Unauthorized when No User is found", async () => {
        const response = await request(app)
            .get(`/activity/1/repayment`)
            .set('username', 'testadminuser')
        expect(response.status).toBe(401);
    });

    test("Admin can view all loan repayment activities", async () => {
        const responseLoan1 = await request(app)
            .get(`/activity/1/repayment`)
            .set('username', 'adminuser')
        const responseLoan2 = await request(app)
            .get(`/activity/2/repayment`)
            .set('username', 'adminuser')
        
        expect(responseLoan1.status).toBe(200);
        expect(responseLoan1.body.length).toBe(5);
        expect(responseLoan1.body[0]['activity']).toBe(RepaymentActivityType.SCHEDULE_CREATED);
        expect(responseLoan1.body[1]['activity']).toBe(RepaymentActivityType.PAYMENT_MADE);
        expect(responseLoan1.body[2]['activity']).toBe(RepaymentActivityType.SCHEDULE_UPDATED);
        expect(responseLoan1.body[3]['activity']).toBe(RepaymentActivityType.DEFAULTED);
        expect(responseLoan1.body[4]['activity']).toBe(RepaymentActivityType.PAYMENT_MADE);

        expect(responseLoan2.status).toBe(200);
        expect(responseLoan2.body.length).toBe(3);
        expect(responseLoan2.body[0]['activity']).toBe(RepaymentActivityType.SCHEDULE_CREATED);
        expect(responseLoan2.body[1]['activity']).toBe(RepaymentActivityType.PAYMENT_MADE);
        expect(responseLoan2.body[2]['activity']).toBe(RepaymentActivityType.PAYMENT_MADE);
    });

    test("Customer can view only their own loan repayment activity", async () => {
        const customer1Loan1Response = await request(app)
            .get(`/activity/1/repayment`)
            .set('username', 'testuser')
        const customer1Loan2Response = await request(app)
            .get(`/activity/2/repayment`)
            .set('username', 'testuser')
        const customer2Loan1Response = await request(app)
            .get(`/activity/1/repayment`)
            .set('username', 'testusertwo')
        const customer2Loan2Response = await request(app)
            .get(`/activity/2/repayment`)
            .set('username', 'testusertwo')
        
        expect(customer1Loan1Response.status).toBe(200);
        expect(customer1Loan1Response.body.length).toBe(5);
        expect(customer1Loan1Response.body[0]['activity']).toBe(RepaymentActivityType.SCHEDULE_CREATED);
        expect(customer1Loan1Response.body[1]['activity']).toBe(RepaymentActivityType.PAYMENT_MADE);
        expect(customer1Loan1Response.body[2]['activity']).toBe(RepaymentActivityType.SCHEDULE_UPDATED);
        expect(customer1Loan1Response.body[3]['activity']).toBe(RepaymentActivityType.DEFAULTED);
        expect(customer1Loan1Response.body[4]['activity']).toBe(RepaymentActivityType.PAYMENT_MADE);

        expect(customer1Loan2Response.status).toBe(404);
        expect(customer2Loan1Response.status).toBe(404);

        expect(customer2Loan2Response.status).toBe(200);
        expect(customer2Loan2Response.body.length).toBe(3);
        expect(customer2Loan2Response.body[0]['activity']).toBe(RepaymentActivityType.SCHEDULE_CREATED);
        expect(customer2Loan2Response.body[1]['activity']).toBe(RepaymentActivityType.PAYMENT_MADE);
        expect(customer2Loan2Response.body[2]['activity']).toBe(RepaymentActivityType.PAYMENT_MADE);
    });

})