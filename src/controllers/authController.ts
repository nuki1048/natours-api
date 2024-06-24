/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextFunction, Request, Response } from 'express';
// eslint-disable-next-line import/no-extraneous-dependencies
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

import { promisify } from 'util';
import { User, IUser, UserRoles } from '../models/userModel';
import { catchAsync } from '../utils/catchAsync';
import { AppError } from '../utils/appError';
import { sendEmail } from '../utils/email';

interface UserLogin
  extends Partial<Omit<IUser, 'passwordConfirm' | 'name' | 'photo'>> {}

interface UserUpdatePassword
  extends Pick<IUser, 'password' | 'passwordConfirm'> {
  newPassword: string;
}

const isProduction = process.env.NODE_ENV === 'production';
const signToken = (id: string): string => {
  return jwt.sign({ id }, process.env.JWT_SECRET_KEY, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createSendToken = (user: IUser, statusCode: number, res: Response) => {
  const token = signToken(user._id);

  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 100,
    ),
    secure: isProduction,
    httpOnly: true,
  };

  res.cookie('jwt', token, cookieOptions);

  user.password = undefined;

  return res.status(201).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};

export const logout = (req: Response, res: Response) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
  res.status(200).json({ status: 'success' });
};

export const signup = catchAsync(
  async (
    req: Request<object, object, IUser>,
    res: Response,
    next: NextFunction,
  ) => {
    const newUser = await User.create({
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
      passwordConfirm: req.body.passwordConfirm,

      role: req.body.role,
    });

    return createSendToken(newUser, 201, res);
  },
);

export const login = catchAsync(
  async (
    req: Request<object, object, UserLogin>,
    res: Response,
    next: NextFunction,
  ) => {
    const { email, password } = req.body;

    if (!email || !password) {
      return next(
        new AppError(
          'Please provide both email and password in the request body.',
          400,
        ),
      );
    }
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return next(new AppError('Incorrect email or password', 401));
    }

    const isPasswordCorrect = await user.correctPassword(
      password,
      user.password as string,
    );

    if (!isPasswordCorrect) {
      return next(new AppError('Incorrect email or password', 401));
    }

    return createSendToken(user, 200, res);
  },
);

export const protect = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    if (
      !req.headers.authorization ||
      !req.headers.authorization.startsWith('Bearer')
    ) {
      return next(new AppError('Access denied!', 401));
    }

    const token = req.headers.authorization.replace(/Bearer /, '');

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET_KEY,
    ) as jwt.JwtPayload;

    const currentUser = await User.findById(decoded.id);

    if (!currentUser) {
      return next(
        new AppError(
          'The user belonging to this token does not longer exist',
          401,
        ),
      );
    }

    const isUserChangedPassword = currentUser.changedPasswordAfter(
      decoded.iat as number,
    );

    if (isUserChangedPassword) {
      return next(
        new AppError(
          'Invalid token. You need to log in again after changing the password!',
          401,
        ),
      );
    }

    // Grant access to protected route
    req.user = currentUser;
    next();
  },
);

export const restrictTo = (...roles: UserRoles[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const isUserHavePermission = roles.includes(req?.user?.role as UserRoles);
    if (!isUserHavePermission) {
      return next(
        new AppError('You do not have permission to perform this action', 403),
      );
    }

    return next();
  };
};

export const forgotPassword = catchAsync(
  async (
    req: Request<object, object, Pick<IUser, 'email'>>,
    res: Response,
    next: NextFunction,
  ) => {
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      return next(
        new AppError('There is no user with that email address.', 404),
      );
    }

    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    const resetURL = `${req.protocol}://${req.get(
      'host',
    )}/api/v1/resetPassword/${resetToken}`;

    const message = `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to: ${resetURL}. \n If you didn't forget your password, please ignore this email!`;

    try {
      await sendEmail({
        email: req.body.email,
        subject: 'Your password reset token (valid for 10 min)',
        message,
      });

      res.status(200).json({
        status: 'success',
        message: 'Token send to email!',
      });
    } catch (error) {
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save({ validateBeforeSave: false });

      return next(
        new AppError(
          'There was an error sending the email. Try again later!',
          500,
        ),
      );
    }
  },
);
export const resetPassword = catchAsync(
  async (
    req: Request<
      { token: string },
      object,
      Pick<IUser, 'password' | 'passwordConfirm'>
    >,
    res: Response,
    next: NextFunction,
  ) => {
    const hashedToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    });

    if (!user) {
      return next(new AppError('Token is invalid or has expired', 400));
    }

    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;

    await user.save();

    return createSendToken(user, 201, res);
  },
);

export const updatePassword = catchAsync(
  async (
    req: Request<{ token: string }, object, UserUpdatePassword>,
    res: Response,
    next: NextFunction,
  ) => {
    const user = await User.findById(req?.user?.id).select('+password');

    const isPasswordCorrect = await user?.correctPassword(
      req.body.password as string,
      user.password as string,
    );

    if (!isPasswordCorrect) {
      return next(new AppError('Incorrect email or password', 401));
    }

    if (user) {
      user.password = req.body.newPassword;
      user.passwordConfirm = req.body.passwordConfirm;
      await user.save();

      return createSendToken(user, 201, res);
    }
  },
);

export const isLoggedIn = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (req?.cookies?.jwt ?? false) {
    try {
      // 1) verify token
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const decoded: any = await promisify(jwt.verify)(req.cookies.jwt);

      // 2) Check if user still exists
      const currentUser = await User.findById(decoded.id);
      if (!currentUser) {
        return next();
      }

      // 3) Check if user changed password after the token was issued
      if (currentUser.changedPasswordAfter(decoded.iat)) {
        return next();
      }

      // THERE IS A LOGGED IN USER
      res.locals.user = currentUser;
      return next();
    } catch (err) {
      return next();
    }
  }
  next();
};
