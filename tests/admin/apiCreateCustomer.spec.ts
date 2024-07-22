import request from 'supertest';
import app from '../../src/app';
import { sequelize } from '../../src/config/database';
import { User } from '../../src/models/user';
import { UserRole } from '../../src/enums/user';

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

describe('AdminController - createCustomer', () => {
    
    test("Unauthorized when Admin User not given", async () => {
        const response = await request(app)
            .post('/admin/create-customer')
            .send({
                username: 'faketestuserone',
                firstName: 'faketestuser',
                lastName: 'one'
            });
        expect(response.status).toBe(401);
    });

    test("Unauthorized when No User is found", async () => {
        const response = await request(app)
            .post('/admin/create-customer')
            .set('username', 'testadminuser')
            .send({
                username: 'faketestuserone',
                firstName: 'faketestuser',
                lastName: 'one'
            });
        expect(response.status).toBe(401);
    });

    test("Bad Request when creation payload username is missing", async () => {
        const response = await request(app)
            .post('/admin/create-customer')
            .set('username', 'adminuser')
            .send({
                firstName: 'faketestuser',
                lastName: 'one'
            });
        expect(response.status).toBe(400);
    });

    test("Bad Request when creation payload firstName is missing", async () => {
        const response = await request(app)
            .post('/admin/create-customer')
            .set('username', 'adminuser')
            .send({
                username: 'faketestuserone',
                lastName: 'one'
            });
        expect(response.status).toBe(400);
    });

    test("Bad Request when creation payload lastName is missing", async () => {
        const response = await request(app)
            .post('/admin/create-customer')
            .set('username', 'adminuser')
            .send({
                username: 'faketestuserone',
                firstName: 'faketestuser',
            });
        expect(response.status).toBe(400);
    });

    test("Bad Request when username already present", async () => {
        const response = await request(app)
            .post('/admin/create-customer')
            .set('username', 'adminuser')
            .send({
                username: 'testuser',
                firstName: 'faketestuser',
                lastName: 'one'
            });
        expect(response.status).toBe(400);
    });

    test("Success", async () => {
        const response = await request(app)
            .post('/admin/create-customer')
            .set('username', 'adminuser')
            .send({
                username: 'faketestuserone',
                firstName: 'faketestuser',
                lastName: 'one'
            });
        expect(response.status).toBe(200);
        expect(response.body.firstName).toBe('faketestuser');
        expect(response.body.lastName).toBe('one');
        expect(response.body.username).toBe('faketestuserone');

        const customer = await User.findOne({ where: { username: 'faketestuserone' } });
        expect(customer).not.toBeNull();
        expect(customer?.getDataValue('firstName')).toBe('faketestuser');
        expect(customer?.getDataValue('username')).toBe('faketestuserone');
        expect(customer?.getDataValue('lastName')).toBe('one');
    });

})