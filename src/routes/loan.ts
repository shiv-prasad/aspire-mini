import { Request, Response, NextFunction, Router } from 'express';
import UserAuthorizationMiddleware from '../middlewares/user';
import { AuthorizedRequest } from '../types/request';
import { LoanController } from '../controllers';
import { BaseRouter } from './baseRouter';
import LoanMiddleware from '../middlewares/loan';

export class LoanRouter extends BaseRouter {
    private controller: LoanController;
    private userAuthorizationMiddleware: UserAuthorizationMiddleware
    private loanMiddleware: LoanMiddleware

    constructor(
        app: string, 
        userAuthorizationMiddleware: UserAuthorizationMiddleware,
        loanMiddleware: LoanMiddleware,
        controller: LoanController
    ) {
        super(app);
        this.userAuthorizationMiddleware = userAuthorizationMiddleware;
        this.loanMiddleware = loanMiddleware;
        this.controller = controller;
    }

    public getRoutes(): Router {
        const router = Router();

        // Apply Middleware

        // Middleware to check if user is authorized or not
        // All the calls will need to pass this middleware
        router.use(`/${this.app}/*`, (req: Request, res: Response, next: NextFunction) => {
            this.userAuthorizationMiddleware.authorizeUser(req as AuthorizedRequest, res, next)
        });
        // Middleware to apply extra filter to request context 
        // to hide uses to view other's user's loans
        router.use(`/${this.app}/*`, (req: Request, res: Response, next: NextFunction) => {
            this.loanMiddleware.listLoan(req as AuthorizedRequest, res, next)
        });
        // Middleware to check if user can access the loan specified by given id
        router.use(`/${this.app}/:id/*`, (req: Request, res: Response, next: NextFunction) => {
            this.loanMiddleware.checkLoan(req as AuthorizedRequest, res, next)
        });

        // Attach API Controllers to serve routes
        router.get(`/${this.app}/all`, (req: Request, res: Response, next: NextFunction) => {
            this.controller.getAllLoans(req as AuthorizedRequest, res, next);
        });
        router.get(`/${this.app}/:id/detail`, (req: Request, res: Response, next: NextFunction) => {
            this.controller.getLoanDetails(req as AuthorizedRequest, res, next);
        });
        router.get(`/${this.app}/:id/payment-schedule`, (req: Request, res: Response, next: NextFunction) => {
            this.controller.getLoanPaymentSchedule(req as AuthorizedRequest, res, next);
        });
        return router;
    }
}