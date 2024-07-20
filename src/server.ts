import app from './app';
import { sequelize } from './config/database';
import { UserRole } from './enums/user';
import { User } from './models/user';

const PORT = process.env.PORT || 3000;

async function seed() {
    await Promise.all([
        User.create({
            id: 1,
            firstName: 'Harry',
            lastName: 'Potter',
            username: 'harrypotter',
            role: UserRole.CUSTOMER
        }),
        User.create({
            id: 2,
            firstName: 'Hermione',
            lastName: 'Granger',
            username: 'hermionegranger',
            role: UserRole.CUSTOMER
        }),
        User.create({
            id: 3,
            firstName: 'Ron',
            lastName: 'Weasley',
            username: 'ronweasley',
            role: UserRole.CUSTOMER
        }),
        User.create({
            id: 4,
            firstName: 'Shiv',
            lastName: 'Prasad',
            username: 'shivprasad',
            role: UserRole.ADMIN
        }),
        User.create({
            id: 5,
            firstName: 'Cron',
            lastName: 'User',
            username: 'cronuser',
            role: UserRole.ADMIN
        }),
    ]);
}

(async() => {
    await sequelize.sync({ alter: true });
    await seed();
})();

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});