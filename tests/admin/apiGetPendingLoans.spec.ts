import request from 'supertest';
import app from '../../src/app';
import { sequelize } from '../../src/config/database';
import { User } from '../../src/models/user';
import { UserRole } from '../../src/enums/user';
import { Loan } from '../../src/models/loan';
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
    await Loan.create({
        id: 6,
        totalAmount: 1000,
        status: LoanStatus.PAID,
        totalTerms: 3,
        remainingAmount: 0,
        UserId: 3
    })
    await Loan.create({
        id: 7,
        totalAmount: 1000,
        status: LoanStatus.PENDING,
        totalTerms: 3,
        remainingAmount: 0,
        UserId: 3
    })
});

afterAll(async () => {
    await sequelize.close();
});

describe('AdminController - getPendingLoans', () => {
    
    test("Unauthorized when Admin User not given", async () => {
        const response = await request(app)
            .get('/admin/loan-requests')
        expect(response.status).toBe(401);
    });

    test("Unauthorized when No User is found", async () => {
        const response = await request(app)
            .get('/admin/loan-requests')
            .set('username', 'testadminuser')
        expect(response.status).toBe(401);
    });

    test("Unauthorized when User is not Admin", async () => {
        const response = await request(app)
            .get('/admin/loan-requests')
            .set('username', 'testuser')
        expect(response.status).toBe(401);
    });

    test("Success", async () => {
        const response = await request(app)
            .get('/admin/loan-requests')
            .set('username', 'adminuser')
        expect(response.status).toBe(200);
        expect(response.body.length).toBe(2);
        expect(response.body[0].id).toBe(1);
        expect(response.body[1].id).toBe(7);
    });

})