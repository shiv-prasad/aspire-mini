import request from 'supertest';
import app from '../../src/app';
import { sequelize } from '../../src/config/database';
import { User } from '../../src/models/user';
import { UserRole } from '../../src/enums/user';
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
    await RepaymentSchedule.create({
        LoanId: 1,
        totalAmount: 500
    })
    await RepaymentSchedule.create({
        LoanId: 1,
        totalAmount: 300
    })
    await RepaymentSchedule.create({
        LoanId: 1,
        totalAmount: 200
    })

    await Loan.create({
        id: 2,
        totalAmount: 800,
        totalTerms: 3,
        remainingAmount: 800,
        UserId: 3
    });
    await RepaymentSchedule.create({
        LoanId: 2,
        totalAmount: 500
    })
    await RepaymentSchedule.create({
        LoanId: 2,
        totalAmount: 300
    })
});

afterAll(async () => {
    await sequelize.close();
});

describe('LoanController - Get Loan Repayment Details', () => {
    
    test("Unauthorized when Username not given", async () => {
        const response = await request(app)
            .get(`/loans/1/payment-schedule`)
        expect(response.status).toBe(401);
    });

    test("Unauthorized when No User is found", async () => {
        const response = await request(app)
            .get(`/loans/1/payment-schedule`)
            .set('username', 'testadminuser')
        expect(response.status).toBe(401);
    });

    test("Admin can view all loans", async () => {
        const responseLoanOne = await request(app)
            .get(`/loans/1/payment-schedule`)
            .set('username', 'adminuser')
        const responseLoanTwo = await request(app)
            .get(`/loans/2/payment-schedule`)
            .set('username', 'adminuser')
        
        expect(responseLoanOne.status).toBe(200);
        expect(responseLoanTwo.status).toBe(200);

        const loanOneResponse = responseLoanOne.body
        expect(loanOneResponse.length).toBe(3)
        expect(loanOneResponse[0].LoanId).toBe(1)
        expect(loanOneResponse[0].totalAmount).toBe(500)
        expect(loanOneResponse[1].LoanId).toBe(1)
        expect(loanOneResponse[1].totalAmount).toBe(300)
        expect(loanOneResponse[2].LoanId).toBe(1)
        expect(loanOneResponse[2].totalAmount).toBe(200)

        const loanTwoResponse = responseLoanTwo.body
        expect(loanTwoResponse.length).toBe(2)
        expect(loanTwoResponse[0].LoanId).toBe(2)
        expect(loanTwoResponse[0].totalAmount).toBe(500)
        expect(loanTwoResponse[1].LoanId).toBe(2)
        expect(loanTwoResponse[1].totalAmount).toBe(300)
    });

    test("Customer can view only their own loan activity", async () => {
        const customerOneLoanOneResponse = await request(app)
            .get(`/loans/1/payment-schedule`)
            .set('username', 'testuser')
        const customerOneLoanTwoResponse = await request(app)
            .get(`/loans/2/payment-schedule`)
            .set('username', 'testuser')
        const customerTwoLoanOneResponse = await request(app)
            .get(`/loans/1/payment-schedule`)
            .set('username', 'testusertwo')
        const customerTwoLoanTwoResponse = await request(app)
            .get(`/loans/2/payment-schedule`)
            .set('username', 'testusertwo')

        expect(customerOneLoanOneResponse.status).toBe(200);
        const loanOneResponse = customerOneLoanOneResponse.body
        expect(loanOneResponse.length).toBe(3)
        expect(loanOneResponse[0].LoanId).toBe(1)
        expect(loanOneResponse[0].totalAmount).toBe(500)
        expect(loanOneResponse[1].LoanId).toBe(1)
        expect(loanOneResponse[1].totalAmount).toBe(300)
        expect(loanOneResponse[2].LoanId).toBe(1)
        expect(loanOneResponse[2].totalAmount).toBe(200)

        expect(customerOneLoanTwoResponse.status).toBe(404);
        expect(customerTwoLoanOneResponse.status).toBe(404);

        expect(customerTwoLoanTwoResponse.status).toBe(200);
        const loanTwoResponse = customerTwoLoanTwoResponse.body
        expect(loanTwoResponse.length).toBe(2)
        expect(loanTwoResponse[0].LoanId).toBe(2)
        expect(loanTwoResponse[0].totalAmount).toBe(500)
        expect(loanTwoResponse[1].LoanId).toBe(2)
        expect(loanTwoResponse[1].totalAmount).toBe(300)
    });

})