import request from 'supertest';
import app from '../../src/app';
import { sequelize } from '../../src/config/database';
import { User } from '../../src/models/user';
import { UserRole } from '../../src/enums/user';
import { Loan } from '../../src/models/loan';
import { LoanActivityType, RepaymentActivityType } from '../../src/enums/loan';
import { LoanActivity } from '../../src/models/loanActivity';
import { RepaymentActivity } from '../../src/models/repaymentActivity';
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
    await LoanActivity.create({
        LoanId: 1,
        activity: LoanActivityType.REQUEST_CREATED
    })
    await LoanActivity.create({
        LoanId: 1,
        activity: LoanActivityType.LOAN_APPROVED
    })
    await RepaymentActivity.create({
        LoanId: 1,
        activity: RepaymentActivityType.SCHEDULE_CREATED
    })
    await RepaymentActivity.create({
        LoanId: 1,
        activity: RepaymentActivityType.PAYMENT_MADE
    })
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
    await LoanActivity.create({
        LoanId: 2,
        activity: LoanActivityType.REQUEST_CREATED
    })
    await RepaymentActivity.create({
        LoanId: 2,
        activity: RepaymentActivityType.SCHEDULE_CREATED
    })
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

describe('LoanController - Get Loan Details', () => {
    
    test("Unauthorized when Username not given", async () => {
        const response = await request(app)
            .get(`/loans/1/detail`)
        expect(response.status).toBe(401);
    });

    test("Unauthorized when No User is found", async () => {
        const response = await request(app)
            .get(`/loans/1/detail`)
            .set('username', 'testadminuser')
        expect(response.status).toBe(401);
    });

    test("Admin can view all loans", async () => {
        const responseLoanOne = await request(app)
            .get(`/loans/1/detail`)
            .set('username', 'adminuser')
        const responseLoanTwo = await request(app)
            .get(`/loans/2/detail`)
            .set('username', 'adminuser')
        
        expect(responseLoanOne.status).toBe(200);
        expect(responseLoanTwo.status).toBe(200);

        const loanOneResponse = responseLoanOne.body
        expect(loanOneResponse.id).toBe(1)
        expect(loanOneResponse.totalAmount).toBe(1000)
        expect(loanOneResponse.LoanActivities.length).toBe(2)
        expect(loanOneResponse.LoanRepaymentSchedules.length).toBe(3)
        expect(loanOneResponse.LoanRepaymentActivities.length).toBe(2)

        const loanTwoResponse = responseLoanTwo.body
        expect(loanTwoResponse.id).toBe(2)
        expect(loanTwoResponse.totalAmount).toBe(800)
        expect(loanTwoResponse.LoanActivities.length).toBe(1)
        expect(loanTwoResponse.LoanRepaymentSchedules.length).toBe(2)
        expect(loanTwoResponse.LoanRepaymentActivities.length).toBe(1)
    });

    test("Customer can view only their own loan activity", async () => {
        const customerOneLoanOneResponse = await request(app)
            .get(`/loans/1/detail`)
            .set('username', 'testuser')
        const customerOneLoanTwoResponse = await request(app)
            .get(`/loans/2/detail`)
            .set('username', 'testuser')
        const customerTwoLoanOneResponse = await request(app)
            .get(`/loans/1/detail`)
            .set('username', 'testusertwo')
        const customerTwoLoanTwoResponse = await request(app)
            .get(`/loans/2/detail`)
            .set('username', 'testusertwo')

        expect(customerOneLoanOneResponse.status).toBe(200);
        const loanOneResponse = customerOneLoanOneResponse.body
        expect(loanOneResponse.id).toBe(1)
        expect(loanOneResponse.totalAmount).toBe(1000)
        expect(loanOneResponse.LoanActivities.length).toBe(2)
        expect(loanOneResponse.LoanRepaymentSchedules.length).toBe(3)
        expect(loanOneResponse.LoanRepaymentActivities.length).toBe(2)

        expect(customerOneLoanTwoResponse.status).toBe(404);
        expect(customerTwoLoanOneResponse.status).toBe(404);

        expect(customerTwoLoanTwoResponse.status).toBe(200);
        const loanTwoResponse = customerTwoLoanTwoResponse.body
        expect(loanTwoResponse.id).toBe(2)
        expect(loanTwoResponse.totalAmount).toBe(800)
        expect(loanTwoResponse.LoanActivities.length).toBe(1)
        expect(loanTwoResponse.LoanRepaymentSchedules.length).toBe(2)
        expect(loanTwoResponse.LoanRepaymentActivities.length).toBe(1)
    });

})