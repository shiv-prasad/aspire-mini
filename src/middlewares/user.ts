import { Response, NextFunction } from 'express';
import { HttpStatusCodes } from '../enums/requestHelper';
import UserService from '../services/user';
import { AuthorizedRequest } from '../types/request';

/**
 * Middelwares for User Authorization
 */
export default class UserAuthorizationMiddleware {

    private userService: UserService;

    constructor(userService: UserService) {
        this.userService = userService;
    }

    /** 
     * CHecks if the user sent in request is present in the system or not
     * If present, updates the request context with user information
     * @param req 
     * @param res 
     * @param next 
     * @returns 
     */
    public async authorizeUser(req: AuthorizedRequest, res: Response, next: NextFunction) {
        const username = req.headers['username'] as string;
        if (!username) {
            return res.status(HttpStatusCodes.UNAUTHORIZED).json({ error: 'No Username Provided' });
        }
        try {
            // Search the user by username if user is present the system or not
            const user = await this.userService.getUserByUsername(username)
            if(!user) return res.status(HttpStatusCodes.UNAUTHORIZED).json({ error: 'Invalid Username' });

            // Updates the request context with user information
            req.user = user;
            next();
        } catch (err) {
            return res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({ error: 'Something went wrong' });
        }
    }
}