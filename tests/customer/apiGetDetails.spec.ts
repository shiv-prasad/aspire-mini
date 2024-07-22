import request from 'supertest';
import app from '../../src/app';
import { sequelize } from '../../src/config/database';
import { User } from '../../src/models/user';
import { Loan } from '../../src/models/loan';
import { UserRole } from '../../src/enums/user';
import { LoanStatus } from '../../src/enums/loan';

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
        totalTerms: 3,
        remainingAmount: 1000,
        UserId: 2
    });
    await Loan.create({
        id: 2,
        totalAmount: 1000,
        status: LoanStatus.APPROVED,
        totalTerms: 3,
        remainingAmount: 1000,
        UserId: 2
    });
    await Loan.create({
        id: 3,
        totalAmount: 1000,
        status: LoanStatus.APPROVED,
        totalTerms: 3,
        remainingAmount: 300,
        UserId: 2
    });
    await Loan.create({
        id: 4,
        totalAmount: 1000,
        status: LoanStatus.REJECTED,
        totalTerms: 3,
        remainingAmount: 1000,
        UserId: 2
    });
    await Loan.create({
        id: 5,
        totalAmount: 1000,
        status: LoanStatus.PAID,
        totalTerms: 3,
        remainingAmount: 0,
        UserId: 2
    })
});

afterAll(async () => {
    await sequelize.close();
});

describe('CustomerController - getDetails', () => {
    
    test("Unauthorized when Customer User not given", async () => {
        const response = await request(app)
            .get('/customer/details')
        expect(response.status).toBe(401);
    });

    test("Unauthorized when User is not found User not given", async () => {
        const response = await request(app)
            .get('/customer/details')
            .set('username', 'faketestuser')
        expect(response.status).toBe(401);
    });

    test("Unauthorized when User is not customer", async () => {
        const response = await request(app)
            .get('/customer/details')
            .set('username', 'adminuser')
        expect(response.status).toBe(401);
    });

    test("Success", async () => {
        const response = await request(app)
            .get('/customer/details')
            .set('username', 'testuser')
        expect(response.status).toBe(200);
        expect(response.body.user.id).toBe(2);
        expect(response.body.user.firstName).toBe('test');
        expect(response.body.user.lastName).toBe('user');
        expect(response.body.user.username).toBe('testuser');

        expect(response.body.totalLoans).toBe(5)
        expect(response.body.requestedLoans).toBe(1)
        expect(response.body.rejectedLoans).toBe(1)
        expect(response.body.activeLoans).toBe(2)
        expect(response.body.completedLoans).toBe(1)
        expect(response.body.totalLiability).toBe(3300)
        expect(response.body.totalPaid).toBe(1700)
    });

})