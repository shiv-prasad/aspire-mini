import { Response, NextFunction } from 'express';
import { HttpStatusCodes } from '../enums/requestHelper';
import { UserRole } from '../enums/user';
import UserService from '../services/user';
import { AuthorizedRequest } from '../types/request';

/**
 * Middleware for Customer Related actions
 */
export default class CustomerMiddleware {

    private userService: UserService;

    constructor(userService: UserService) {
        this.userService = userService;
    }

    /**
     * Checks if the logged in user is customer or not
     * If user is not customer, unauthorize the request
     * @param req 
     * @param res 
     * @param next 
     * @returns 
     */
    public async checkIfCustomer(req: AuthorizedRequest, res: Response, next: NextFunction) {
        try {
            const userRole: UserRole = await this.userService.getUserRole(req.user)
            if (userRole !== UserRole.CUSTOMER) {
                return res.status(HttpStatusCodes.UNAUTHORIZED).json({ error: 'Invalid Customer' });
            };
            next();
        } catch (err) {
            return res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({ error: 'Something went wrong' });
        }
    }
}