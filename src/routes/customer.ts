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

        // Middleware
        router.use(`/${this.app}/*`, (req: Request, res: Response, next: NextFunction) => {
            this.userAuthorizationMiddleware.authorizeUser(req as AuthorizedRequest, res, next);
        });

        router.use(`/${this.app}/*`, (req: Request, res: Response, next: NextFunction) => {
            this.customerMiddleware.checkIfCustomer(req as AuthorizedRequest, res, next);
        });

        // Routes
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
