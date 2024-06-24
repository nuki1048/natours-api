/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextFunction, Request, Response } from 'express';
import mongoose from 'mongoose';
import { Review } from '../models/reviewModel';
import * as factory from './handlerFactory';

export const setTourAndUserIds = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (!req.body.tour) req.body.tour = req.params.tourId;
  if (!req.body.user) req.body.user = req?.user?.id;
  next();
};
export const getAllReviews = factory.getAll(
  Review as unknown as mongoose.Model<unknown>,
);

export const getReview = factory.getOne(
  Review as unknown as mongoose.Model<unknown>,
);

export const createReview = factory.createOne(
  Review as unknown as mongoose.Model<unknown>,
);

export const deleteReview = factory.deleteOne(
  Review as unknown as mongoose.Model<unknown>,
);

export const updateReview = factory.updateOne(
  Review as unknown as mongoose.Model<unknown>,
);
