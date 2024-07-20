import { Response, NextFunction } from 'express';
import { HttpStatusCodes } from '../enums/requestHelper';
import { UserRole } from '../enums/user';
import UserService from '../services/user';
import { AuthorizedRequest } from '../types/request';

export default class AdminMiddleware {

    private userService: UserService;

    constructor(userService: UserService) {
        this.userService = userService;
    }

    public async checkIfAdmin(req: AuthorizedRequest, res: Response, next: NextFunction) {
        try {
            const userRole: UserRole = await this.userService.getUserRole(req.user)
            if (userRole !== UserRole.ADMIN) {
                return res.status(HttpStatusCodes.UNAUTHORIZED).json({ error: 'Invalid Admin' });
            };
            next();
        } catch (err) {
            return res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({ error: 'Something went wrong' });
        }
    }
}