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

describe('LoanController - Get All Loans', () => {
    
    test("Unauthorized when Username not given", async () => {
        const response = await request(app)
            .get(`/loans/all`)
        expect(response.status).toBe(401);
    });

    test("Unauthorized when No User is found", async () => {
        const response = await request(app)
            .get(`/loans/all`)
            .set('username', 'testadminuser')
        expect(response.status).toBe(401);
    });

    test("Admin can view all loans", async () => {
        const response = await request(app)
            .get(`/loans/all`)
            .set('username', 'adminuser')
        
        expect(response.status).toBe(200);
        expect(response.body.length).toBe(2);

        const loanOneResponse = response.body[0]
        expect(loanOneResponse.id).toBe(1)
        expect(loanOneResponse.totalAmount).toBe(1000)
        expect(loanOneResponse.LoanActivities.length).toBe(2)
        expect(loanOneResponse.LoanRepaymentSchedules.length).toBe(3)
        expect(loanOneResponse.LoanRepaymentActivities.length).toBe(2)

        const loanTwoResponse = response.body[1]
        expect(loanTwoResponse.id).toBe(2)
        expect(loanTwoResponse.totalAmount).toBe(800)
        expect(loanTwoResponse.LoanActivities.length).toBe(1)
        expect(loanTwoResponse.LoanRepaymentSchedules.length).toBe(2)
        expect(loanTwoResponse.LoanRepaymentActivities.length).toBe(1)
    });

    test("Customer can view only their own loans", async () => {
        const customerOneLoanResponse = await request(app)
            .get(`/loans/all`)
            .set('username', 'testuser')
        const customerTwoLoanResponse = await request(app)
            .get(`/loans/all`)
            .set('username', 'testusertwo')

        expect(customerOneLoanResponse.status).toBe(200);
        expect(customerOneLoanResponse.body.length).toBe(1);

        expect(customerTwoLoanResponse.status).toBe(200);
        expect(customerTwoLoanResponse.body.length).toBe(1);

        const loanOneResponse = customerOneLoanResponse.body[0]
        expect(loanOneResponse.id).toBe(1)
        expect(loanOneResponse.totalAmount).toBe(1000)
        expect(loanOneResponse.LoanActivities.length).toBe(2)
        expect(loanOneResponse.LoanRepaymentSchedules.length).toBe(3)
        expect(loanOneResponse.LoanRepaymentActivities.length).toBe(2)

        const loanTwoResponse = customerTwoLoanResponse.body[0]
        expect(loanTwoResponse.id).toBe(2)
        expect(loanTwoResponse.totalAmount).toBe(800)
        expect(loanTwoResponse.LoanActivities.length).toBe(1)
        expect(loanTwoResponse.LoanRepaymentSchedules.length).toBe(2)
        expect(loanTwoResponse.LoanRepaymentActivities.length).toBe(1)
    });

})