import { Error } from 'mongoose';

// eslint-disable-next-line import/prefer-default-export
export class AppError extends Error {
  statusCode: number;

  status: string;

  isOperational: boolean;

  path?: string;

  value?: string;

  code?: number;

  errmsg?: string;

  errors?: Error.ValidationError;

  constructor(message: string, statusCode: number) {
    super(message);

    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}
