/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextFunction, Request, Response } from 'express';
import { Error } from 'mongoose';
import { AppError } from '../utils/appError';
import { Environment } from '../global/interfaces';

const DUPLICATION_ERROR_CODE = 11000;

const sendErrorDev = (err: AppError, res: Response) => {
  return res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
  });
};

const sendErrorProd = (err: AppError, res: Response) => {
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  }

  // eslint-disable-next-line no-console
  console.error('ERROR 💥', err.message);

  return res.status(500).json({
    status: 'error',
    message: 'Something went very wrong!',
  });
};

const handleCastErrorDB = (err: AppError) => {
  const ERROR_MESSAGE = `Invalid ${err.path}: ${err.value}`;

  return new AppError(ERROR_MESSAGE, 400);
};

const handleDuplicateFieldsDB = (err: AppError) => {
  const value = err?.errmsg?.match(/(["'])(\\?.)*?\1/)?.[0];

  const ERROR_MESSAGE = `Duplicate field value: ${value}. Please use another value!`;
  return new AppError(ERROR_MESSAGE, 400);
};

const handleValidationErrorDB = (err: AppError) => {
  const errors = Object.values(err?.errors || {}).map(
    (error: Error.ValidationError) => error.message,
  );

  const ERROR_MESSAGE = `Please correct the following errors: ${errors.join(
    '. ',
  )}`;

  return new AppError(ERROR_MESSAGE, 400);
};

const handleJWTError = () => {
  const ERROR_MESSAGE = `Invalid token. Please provide a valid token!`;

  return new AppError(ERROR_MESSAGE, 401);
};

const handleJWTExpiredError = () => {
  const ERROR_MESSAGE = `Expired token. Please log in again!`;

  return new AppError(ERROR_MESSAGE, 401);
};

// eslint-disable-next-line import/prefer-default-export
export function errorHandler(
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction,
) {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === Environment.Development) {
    return sendErrorDev(err, res);
  }

  let handledError = { ...err };

  if (handledError instanceof Error.CastError) {
    handledError = handleCastErrorDB(handledError);
  }

  if (handledError.code === DUPLICATION_ERROR_CODE) {
    handledError = handleDuplicateFieldsDB(handledError);
  }

  if (handledError instanceof Error.ValidationError) {
    handledError = handleValidationErrorDB(handledError);
  }

  if (handledError.name === 'JsonWebTokenError') {
    handledError = handleJWTError();
  }

  if (handledError.name === 'TokenExpiredError') {
    handledError = handleJWTExpiredError();
  }

  return sendErrorProd(handledError, res);
}
