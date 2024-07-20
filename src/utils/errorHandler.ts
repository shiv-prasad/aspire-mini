import { Request, Response, NextFunction } from 'express';
import { CustomError } from '../classes/customError';

export function handleError (
    err: unknown,
    req: Request,
    res: Response,
    next: NextFunction
) {
    let customError = err;
    if (!(err instanceof CustomError)) {
        customError = new CustomError('Something went wrong');
    }
    res.status((customError as CustomError).status).send(customError);
    next();
};
