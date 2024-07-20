import { Request, Response, NextFunction, Router } from 'express';
import UserAuthorizationMiddleware from '../middlewares/user';
import { AuthorizedRequest } from '../types/request';
import { BaseRouter } from './baseRouter';
import { JobsController } from '../controllers';
import AdminMiddleware from '../middlewares/admin';


export class JobsRouter extends BaseRouter {
    private controller: JobsController;
    private userAuthorizationMiddleware: UserAuthorizationMiddleware
    private adminMiddleware: AdminMiddleware;

    constructor(
        app: string,
        userAuthorizationMiddleware: UserAuthorizationMiddleware,
        adminMiddleware: AdminMiddleware,
        jobsController: JobsController
    ) {
        super(app);
        this.userAuthorizationMiddleware = userAuthorizationMiddleware;
        this.adminMiddleware = adminMiddleware
        this.controller = jobsController;
    }

    public getRoutes(): Router {
        const router = Router();

        // Middleware
        router.use(`/${this.app}/*`, (req: Request, res: Response, next: NextFunction) => {
            this.userAuthorizationMiddleware.authorizeUser(req as AuthorizedRequest, res, next)
        });
        router.use(`/${this.app}/*`, (req: Request, res: Response, next: NextFunction) => {
            this.adminMiddleware.checkIfAdmin(req as AuthorizedRequest, res, next)
        });

        // Controllers
        router.post(`/${this.app}/check-for-late-payments`, (req: Request, res: Response, next: NextFunction) => {
            this.controller.checkAndUpdateOutstandingLoans(req as AuthorizedRequest, res, next);
        });
        return router;
    }
}