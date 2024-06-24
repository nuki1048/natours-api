import { NextFunction, Request, Response } from 'express';

// eslint-disable-next-line import/prefer-default-export
export const catchAsync =
  <
    ReqParams = unknown,
    ResBody = unknown,
    ReqBody = unknown,
    ReqQuery = unknown,
  >(
    fn: (
      req: Request<ReqParams, ResBody, ReqBody, ReqQuery>,
      res: Response<ResBody>,
      next: NextFunction,
    ) => Promise<unknown>,
  ) =>
  (
    req: Request<ReqParams, ResBody, ReqBody, ReqQuery>,
    res: Response<ResBody>,
    next: NextFunction,
  ) => {
    fn(req, res, next).catch(next);
  };
