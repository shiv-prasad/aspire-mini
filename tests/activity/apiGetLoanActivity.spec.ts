import request from 'supertest';
import app from '../../src/app';
import { sequelize } from '../../src/config/database';
import { User } from '../../src/models/user';
import { UserRole } from '../../src/enums/user';
import { Loan } from '../../src/models/loan';
import { LoanActivityType } from '../../src/enums/loan';
import { LoanActivity } from '../../src/models/loanActivity';

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
    await LoanActivity.create({
        LoanId: 1,
        activity: LoanActivityType.REQUEST_CREATED
    })
    await LoanActivity.create({
        LoanId: 1,
        activity: LoanActivityType.LOAN_APPROVED
    })
    await LoanActivity.create({
        LoanId: 1,
        activity: LoanActivityType.REPAYMENT_DONE
    })
    await LoanActivity.create({
        LoanId: 1,
        activity: LoanActivityType.DEFAULTED
    })
    await LoanActivity.create({
        LoanId: 1,
        activity: LoanActivityType.REPAYMENT_DONE
    })
    await LoanActivity.create({
        LoanId: 1,
        activity: LoanActivityType.LOAN_CLOSED
    })

    await Loan.create({
        id: 2,
        totalAmount: 1000,
        totalTerms: 3,
        remainingAmount: 1000,
        UserId: 3
    });
    await LoanActivity.create({
        LoanId: 2,
        activity: LoanActivityType.REQUEST_CREATED
    })
    await LoanActivity.create({
        LoanId: 2,
        activity: LoanActivityType.LOAN_APPROVED
    })
    await LoanActivity.create({
        LoanId: 2,
        activity: LoanActivityType.REPAYMENT_DONE
    })
    await LoanActivity.create({
        LoanId: 2,
        activity: LoanActivityType.LOAN_CLOSED
    })
});

afterAll(async () => {
    await sequelize.close();
});

describe('ActivityController - LoanActivity', () => {
    
    test("Unauthorized when Username not given", async () => {
        const response = await request(app)
            .get(`/activity/1/loan`)
        expect(response.status).toBe(401);
    });

    test("Unauthorized when No User is found", async () => {
        const response = await request(app)
            .get(`/activity/1/loan`)
            .set('username', 'testadminuser')
        expect(response.status).toBe(401);
    });

    test("Admin can view all loan activities", async () => {
        const responseLoan1 = await request(app)
            .get(`/activity/1/loan`)
            .set('username', 'adminuser')
        const responseLoan2 = await request(app)
            .get(`/activity/2/loan`)
            .set('username', 'adminuser')
        
        expect(responseLoan1.status).toBe(200);
        expect(responseLoan1.body.length).toBe(6);
        expect(responseLoan1.body[0]['activity']).toBe(LoanActivityType.REQUEST_CREATED);
        expect(responseLoan1.body[1]['activity']).toBe(LoanActivityType.LOAN_APPROVED);
        expect(responseLoan1.body[2]['activity']).toBe(LoanActivityType.REPAYMENT_DONE);
        expect(responseLoan1.body[3]['activity']).toBe(LoanActivityType.DEFAULTED);
        expect(responseLoan1.body[4]['activity']).toBe(LoanActivityType.REPAYMENT_DONE);
        expect(responseLoan1.body[5]['activity']).toBe(LoanActivityType.LOAN_CLOSED);

        expect(responseLoan2.status).toBe(200);
        expect(responseLoan2.body.length).toBe(4);
        expect(responseLoan2.body[0]['activity']).toBe(LoanActivityType.REQUEST_CREATED);
        expect(responseLoan2.body[1]['activity']).toBe(LoanActivityType.LOAN_APPROVED);
        expect(responseLoan2.body[2]['activity']).toBe(LoanActivityType.REPAYMENT_DONE);
        expect(responseLoan2.body[3]['activity']).toBe(LoanActivityType.LOAN_CLOSED);
    });

    test("Customer can view only their own loan activity", async () => {
        const customer1Loan1Response = await request(app)
            .get(`/activity/1/loan`)
            .set('username', 'testuser')
        const customer1Loan2Response = await request(app)
            .get(`/activity/2/loan`)
            .set('username', 'testuser')
        const customer2Loan1Response = await request(app)
            .get(`/activity/1/loan`)
            .set('username', 'testusertwo')
        const customer2Loan2Response = await request(app)
            .get(`/activity/2/loan`)
            .set('username', 'testusertwo')
        
        expect(customer1Loan1Response.status).toBe(200);
        expect(customer1Loan1Response.body.length).toBe(6);
        expect(customer1Loan1Response.body[0]['activity']).toBe(LoanActivityType.REQUEST_CREATED);
        expect(customer1Loan1Response.body[1]['activity']).toBe(LoanActivityType.LOAN_APPROVED);
        expect(customer1Loan1Response.body[2]['activity']).toBe(LoanActivityType.REPAYMENT_DONE);
        expect(customer1Loan1Response.body[3]['activity']).toBe(LoanActivityType.DEFAULTED);
        expect(customer1Loan1Response.body[4]['activity']).toBe(LoanActivityType.REPAYMENT_DONE);
        expect(customer1Loan1Response.body[5]['activity']).toBe(LoanActivityType.LOAN_CLOSED);

        expect(customer1Loan2Response.status).toBe(404);
        expect(customer2Loan1Response.status).toBe(404);

        expect(customer2Loan2Response.status).toBe(200);
        expect(customer2Loan2Response.body.length).toBe(4);
        expect(customer2Loan2Response.body[0]['activity']).toBe(LoanActivityType.REQUEST_CREATED);
        expect(customer2Loan2Response.body[1]['activity']).toBe(LoanActivityType.LOAN_APPROVED);
        expect(customer2Loan2Response.body[2]['activity']).toBe(LoanActivityType.REPAYMENT_DONE);
        expect(customer2Loan2Response.body[3]['activity']).toBe(LoanActivityType.LOAN_CLOSED);
    });

})