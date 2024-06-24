/* eslint-disable import/no-extraneous-dependencies */
import express, { Express, NextFunction, Request, Response } from 'express';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import ExpressMongoSanitize from 'express-mongo-sanitize';
import hpp from 'hpp';
import path from 'path';
import tourRouter from './routes/tourRoutes';
import userRouter from './routes/userRoutes';
import reviewsRouter from './routes/reviewRoutes';
import viewsRouter from './routes/viewRoutes';
import { AppError } from './utils/appError';
import { errorHandler } from './controllers/errorController';
import { Environment } from './global/interfaces';

// 1) INIT
const app: Express = express();

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// 2) MIDDLEWARE
app.use(helmet());

if (process.env.NODE_ENV === Environment.Development) {
  app.use(morgan('dev'));
}

const WINDOW_MILISECONDS = 60 * 60 * 1000;
const MAX_LIMIT = 100;

const limiter = rateLimit({
  limit: MAX_LIMIT,
  windowMs: WINDOW_MILISECONDS,
  message: 'To many requests from this IP, please try again in an hour!',
});

app.use('/api', limiter);

app.use(express.json({ limit: '10kb' }));

app.use(ExpressMongoSanitize());

app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsQuantity',
      'ratingsAverage',
      'maxGroupSize',
      'difficulty',
      'price',
    ],
  }),
);

app.use(express.static(path.join(__dirname, 'public')));

// 3) ROUTES
app.use('/', viewsRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewsRouter);

// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.all('*', (req: Request, res: Response, next: NextFunction) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use(errorHandler);

export default app;
