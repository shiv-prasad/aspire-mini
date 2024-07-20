import { Response, NextFunction } from 'express';
import { HttpStatusCodes } from '../enums/requestHelper';
import UserService from '../services/user';
import { AuthorizedRequest } from '../types/request';

export default class UserAuthorizationMiddleware {

    private userService: UserService;

    constructor(userService: UserService) {
        this.userService = userService;
    }

    public async authorizeUser(req: AuthorizedRequest, res: Response, next: NextFunction) {
        const username = req.headers['username'] as string;
        if (!username) {
            return res.status(HttpStatusCodes.UNAUTHORIZED).json({ error: 'No Username Provided' });
        }
        try {
            const user = await this.userService.getUserByUsername(username)
            if(!user) return res.status(HttpStatusCodes.UNAUTHORIZED).json({ error: 'Invalid Username' });
            req.user = user;
            next();
        } catch (err) {
            return res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({ error: 'Something went wrong' });
        }
    }
}