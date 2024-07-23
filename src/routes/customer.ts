import { Request, Response, NextFunction, Router } from 'express';
import UserAuthorizationMiddleware from '../middlewares/user';
import { AuthorizedRequest } from '../types/request';
import { BaseRouter } from './baseRouter';
import CustomerMiddleware from '../middlewares/customer';
import { CustomerController } from '../controllers';

export class CustomerRouter extends BaseRouter {
    private controller: CustomerController;
    private userAuthorizationMiddleware: UserAuthorizationMiddleware;
    private customerMiddleware: CustomerMiddleware;

    constructor(
        app: string,
        userAuthorizationMiddleware: UserAuthorizationMiddleware,
        customerMiddleware: CustomerMiddleware,
        controller: CustomerController
    ) {
        super(app);
        this.userAuthorizationMiddleware = userAuthorizationMiddleware;
        this.customerMiddleware = customerMiddleware
        this.controller = controller;
    }

    public getRoutes(): Router {
        const router = Router();

        // Apply Middleware

        // Apply Middleware to check if user is authorized or not
        // All the calls will need to pass this middleware
        router.use(`/${this.app}/*`, (req: Request, res: Response, next: NextFunction) => {
            this.userAuthorizationMiddleware.authorizeUser(req as AuthorizedRequest, res, next);
        });
        // Apply Middleware to check if the user is customer or not
        // Only customers can access the API Controllers
        router.use(`/${this.app}/*`, (req: Request, res: Response, next: NextFunction) => {
            this.customerMiddleware.checkIfCustomer(req as AuthorizedRequest, res, next);
        });

        // Attach API Controllers to serve routes
        router.get(`/${this.app}/details`, (req: Request, res: Response, next: NextFunction) => {
            this.controller.getUserInfo(req as AuthorizedRequest, res, next)
        });
        router.post(`/${this.app}/request-loan`, (req: Request, res: Response, next: NextFunction) => {
            this.controller.requestLoan(req as AuthorizedRequest, res, next)
        });
        router.post(`/${this.app}/repay-loan`, (req: Request, res: Response, next: NextFunction) => {
            this.controller.repayLoan(req as AuthorizedRequest, res, next)
        });
        
        return router;
    }
}
