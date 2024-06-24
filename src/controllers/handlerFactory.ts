/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import mongoose, { PopulateOptions } from 'mongoose';
import { NextFunction, Request, Response } from 'express';
import { catchAsync } from '../utils/catchAsync';
import { AppError } from '../utils/appError';
import { APIFeatures } from '../utils/apiFeatures';

interface IdParams {
  id: string;
}

interface GetAllToursQuery {
  page: string;
  sort: string;
  limit: string;
  fields: string;
  tourId?: string;
}

export const deleteOne = (Model: mongoose.Model<unknown>) =>
  catchAsync<IdParams>(
    async (
      req: Request<IdParams, any, any, any, Record<string, any>>,
      res: Response,
      next: NextFunction,
    ) => {
      const { id } = req.params;

      const document = await Model.findByIdAndDelete(id);

      if (!document) {
        return next(new AppError('No document found with that ID!', 404));
      }

      res.status(204).json({
        status: 'success',
        data: null,
      });
    },
  );

export const updateOne = (Model: mongoose.Model<unknown>) =>
  catchAsync<IdParams, object>(
    async (
      req: Request<IdParams, object, any, any, Record<string, any>>,
      res: Response,
      next: NextFunction,
    ) => {
      const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
      });

      if (!doc) {
        return next(new AppError('No document found with that ID!', 404));
      }

      res.status(200).json({
        status: 'success',
        data: {
          data: doc,
        },
      });
    },
  );

export const createOne = (Model: mongoose.Model<unknown>) =>
  catchAsync<object, object>(
    async (
      req: Request<object, object, any, any, Record<string, any>>,
      res: Response,
      next: NextFunction,
    ) => {
      const newDoc = await Model.create(req.body);
      res.status(201).json({
        status: 'success',
        data: {
          data: newDoc,
        },
      });
    },
  );

export const getOne = (
  Model: mongoose.Model<unknown>,
  popOptions?: PopulateOptions,
) =>
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    let query = Model.findById(req.params.id);

    if (popOptions) {
      query = query.populate(popOptions);
    }

    const doc = await query;

    if (!doc) {
      return next(new AppError('No document found with that ID!', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        doc,
      },
    });
  });

export const getAll = (Model: mongoose.Model<unknown>) =>
  catchAsync<{ tourId: string }, object, object, Partial<GetAllToursQuery>>(
    async (
      req: Request<
        { tourId: string },
        object,
        object,
        Partial<GetAllToursQuery>
      >,
      res: Response,
      next: NextFunction,
    ) => {
      // To allow for nested GET reviews on tour
      let filter = {};
      if (req.params.tourId) filter = { tour: req.params.tourId };

      const features = new APIFeatures(Model.find(filter), req.query)
        .filter()
        .sort()
        .limitFields()
        .pagination();

      const doc = await features.query;

      res.status(200).json({
        status: 'success',
        results: doc.length,
        data: {
          data: doc,
        },
      });
    },
  );
