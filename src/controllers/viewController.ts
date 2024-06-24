import { NextFunction, Request, Response } from 'express';
import { catchAsync } from '../utils/catchAsync';
// eslint-disable-next-line import/no-import-module-exports
import { Tour } from '../models/tourModel';
// eslint-disable-next-line import/no-import-module-exports
import { User } from '../models/userModel';

export const contentPolicyMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  res.setHeader(
    'Content-Security-Policy',
    "script-src 'self' https://cdnjs.cloudflare.com",
  );

  next();
};

export const getOverviewTemplate = catchAsync(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async (req: Request, res: Response, next: NextFunction) => {
    const tours = await Tour.find();

    res.status(200).render('overview', {
      title: 'All Tours',
      tours,
    });
  },
);

export const getTourTemplate = catchAsync(
  async (req: Request, res: Response) => {
    const tour = await Tour.findById(req.params.id).populate({
      path: 'reviews',
      select: 'review rating user',
    });

    res.status(200).render('tour', {
      title: `${tour?.name} Tour`,
      tour,
    });
  },
);

export const getLoginForm = catchAsync(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async (req: Request, res: Response, next: NextFunction) => {
    res.status(200).render('login', {
      title: `Log into your account`,
    });
  },
);

export const getAccount = (req: Request, res: Response) => {
  res.status(200).render('account', {
    title: 'Your account',
  });
};

export const updateUserData = catchAsync(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async (req: Request, res: Response, next: NextFunction) => {
    const updatedUser = await User.findByIdAndUpdate(
      req?.user?.id,
      {
        name: req.body.name,
        email: req.body.email,
      },
      {
        new: true,
        runValidators: true,
      },
    );

    res.status(200).render('account', {
      title: 'Your account',
      user: updatedUser,
    });
  },
);
