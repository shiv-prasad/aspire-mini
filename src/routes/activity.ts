import { Request, Response, NextFunction, Router } from 'express';
import UserAuthorizationMiddleware from '../middlewares/user';
import { AuthorizedRequest } from '../types/request';
import { BaseRouter } from './baseRouter';
import LoanMiddleware from '../middlewares/loan';
import { ActivityController } from '../controllers';

export class ActivityRouter extends BaseRouter {
    private controller: ActivityController;
    private userAuthorizationMiddleware: UserAuthorizationMiddleware
    private loanMiddleware: LoanMiddleware

    constructor(
        app: string, 
        userAuthorizationMiddleware: UserAuthorizationMiddleware,
        loanMiddleware: LoanMiddleware,
        controller: ActivityController
    ) {
        super(app);
        this.userAuthorizationMiddleware = userAuthorizationMiddleware;
        this.loanMiddleware = loanMiddleware;
        this.controller = controller;
    }

    public getRoutes(): Router {
        const router = Router();

        // Apply Middleware

        // Apply Middleware to check if user is authorized or not
        // All the calls will need to pass this middleware
        router.use(`/${this.app}/*`, (req: Request, res: Response, next: NextFunction) => {
            this.userAuthorizationMiddleware.authorizeUser(req as AuthorizedRequest, res, next)
        });
        // Middleware to check if user can access the loan specified by given id
        router.use(`/${this.app}/:id/*`, (req: Request, res: Response, next: NextFunction) => {
            this.loanMiddleware.checkLoan(req as AuthorizedRequest, res, next)
        });

        // Attach API Controllers to serve routes
        router.get(`/${this.app}/:id/loan`, (req: Request, res: Response, next: NextFunction) => {
            this.controller.getLoanActivity(req as AuthorizedRequest, res, next);
        });
        router.get(`/${this.app}/:id/repayment`, (req: Request, res: Response, next: NextFunction) => {
            this.controller.getRepaymentActivity(req as AuthorizedRequest, res, next);
        });
        return router;
    }
}