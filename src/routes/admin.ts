import { Request, Response, NextFunction, Router } from 'express';
import AdminMiddleware from '../middlewares/admin';
import UserAuthorizationMiddleware from '../middlewares/user';
import { AuthorizedRequest } from '../types/request';
import { AdminController } from '../controllers';
import { BaseRouter } from './baseRouter';

export class AdminRouter extends BaseRouter {
    private controller: AdminController;
    private userAuthorizationMiddleware: UserAuthorizationMiddleware;
    private adminMiddleware: AdminMiddleware;

    constructor(
        app: string,
        userAuthorizationMiddleware: UserAuthorizationMiddleware,
        adminMiddleware: AdminMiddleware,
        adminController: AdminController
    ) {
        super(app);
        this.userAuthorizationMiddleware = userAuthorizationMiddleware;
        this.adminMiddleware = adminMiddleware
        this.controller = adminController;
    }

    public getRoutes(): Router {
        const router = Router();

        // Apply Middleware

        // Apply Middleware to check if user is authorized or not
        // All the calls will need to pass this middleware
        router.use(`/${this.app}/*`, (req: Request, res: Response, next: NextFunction) => {
            this.userAuthorizationMiddleware.authorizeUser(req as AuthorizedRequest, res, next);
        });
        // Apply Middleware to check if the user is admin or not
        // Only admins can access the API Controllers
        router.use(`/${this.app}/*`, (req: Request, res: Response, next: NextFunction) => {
            this.adminMiddleware.checkIfAdmin(req as AuthorizedRequest, res, next);
        });

        // Attach API Controllers to serve routes
        router.get(`/${this.app}/loan-requests`, (req: Request, res: Response, next: NextFunction) => {
            this.controller.getPendingLoanRequests(req as AuthorizedRequest, res, next);
        });

        router.post(`/${this.app}/verify-loan`, (req: Request, res: Response, next: NextFunction) => {
            this.controller.verifyLoan(req as AuthorizedRequest, res, next)
        });

        router.post(`/${this.app}/create-customer`, (req: Request, res: Response, next: NextFunction) => {
            this.controller.createCustomer(req as AuthorizedRequest, res, next)
        });

        return router;
    }
}
