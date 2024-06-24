/* eslint-disable prefer-destructuring */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/indent */
import { NextFunction, Request, Response } from 'express';

import { Model } from 'mongoose';
import multer, { FileFilterCallback } from 'multer';
import { Tour } from '../models/tourModel';
import { catchAsync } from '../utils/catchAsync';
import * as factory from './handlerFactory';
import { AppError } from '../utils/appError';
import sharp from 'sharp';

const multerStorage = multer.memoryStorage();

const multerFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback,
) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an image! Please upload only images', 400));
  }
};

const upload = multer({
  dest: 'src/public/img/users',
  fileFilter: multerFilter,
  storage: multerStorage,
});

export const uploadTourImages = upload.fields([
  { name: 'imageCover', maxCount: 1 },
  { name: 'images', maxCount: 3 },
]);

export const resizeTourImages = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    // eslint-disable-next-line @typescript-eslint/dot-notation
    const imageCover = files['imageCover'];
    // eslint-disable-next-line @typescript-eslint/dot-notation
    const images = files['images'];

    if (!imageCover || !images) return next();

    const timestamp = new Date()
      .toISOString()
      .replace(/[^a-zA-Z0-9_\\-]/g, '-');
    req.body.imageCover = `tour-${req.params.id}-${timestamp}-cover.jpeg`;
    await sharp(imageCover[0].buffer)
      .resize(2000, 1333)
      .toFormat('jpeg')
      .jpeg({ quality: 90 })
      .toFile(`src/public/img/tours/${req.body.imageCover}`);

    req.body.images = [];

    await Promise.all(
      images.map(async (file, i) => {
        const filename = `tour-${req.params.id}-${timestamp}-${i + 1}.jpeg`;
        await sharp(file.buffer)
          .resize(500, 500, { fit: 'cover' })
          .toFormat('jpeg')
          .jpeg({ quality: 90 })
          .toFile(`src/public/img/tours/${filename}`);
        req.body.images.push(filename);
      }),
    );

    next();
  },
);

export const aliasTopTours = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  req.query.limit = '5';
  req.query.sort = 'price,ratingsAverage';
  req.query.fields = 'name,price,ratingsAverage,summary,difficulty';

  next();
};

export const getAllTours = factory.getAll(Tour as unknown as Model<unknown>);

export const getTour = factory.getOne(Tour as unknown as Model<unknown>, {
  path: 'reviews',
});

export const createTour = factory.createOne(Tour as unknown as Model<unknown>);

export const updateTour = factory.updateOne(Tour as unknown as Model<unknown>);

export const deleteTour = factory.deleteOne(Tour as unknown as Model<unknown>);

export const getTourStats = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const stats = await Tour.aggregate([
      { $match: { ratingsAverage: { $gte: 4.5 } } },
      {
        $group: {
          _id: { $toUpper: '$difficulty' },
          // _id: { $toUpper: '$ratingsAverage' },
          numTours: { $sum: 1 },
          numRatings: { $sum: '$ratingsQuantity' },
          avgRating: { $avg: '$ratingsAverage' },
          avgPrice: { $avg: '$price' },
          minPrice: { $min: '$price' },
          maxPrice: { $max: '$price' },
        },
      },
      {
        $sort: { avgPrice: 1 },
      },
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        stats,
      },
    });
  },
);

export const getMonthlyPlan = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { year } = req.params;

    // TODO: Add dynamic sort by choice user, descending OR increasing
    const plan = await Tour.aggregate([
      { $unwind: '$startDates' },
      {
        $match: {
          startDates: {
            $gte: new Date(`${year}-01-01`),
            $lte: new Date(`${year}-12-31`),
          },
        },
      },
      {
        $group: {
          _id: { $month: '$startDates' },
          numToursStarts: { $sum: 1 },
          tours: { $push: '$name' },
        },
      },
      { $addFields: { month: '$_id' } },
      { $project: { _id: 0 } },
      {
        $sort: { month: 1 },
      },
      {
        $limit: 12,
      },
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        plan,
      },
    });
  },
);

enum Unit {
  Kilometers = 'km',
  Miles = 'mi',
}

interface GetToursWithinParams {
  distance: number;
  latlng: string;
  unit: Unit;
}

const RADIUS_EARTH = {
  [Unit.Miles]: 3963.2,
  [Unit.Kilometers]: 6378.1,
};

export const getToursWithin = catchAsync(
  async (
    req: Request<GetToursWithinParams>,
    res: Response,
    next: NextFunction,
  ) => {
    const { distance, latlng, unit } = req.params;
    const [lat, lng] = latlng.split(',');

    // Radius in radians units
    const radius =
      unit === Unit.Miles
        ? distance / RADIUS_EARTH[Unit.Miles]
        : distance / RADIUS_EARTH[Unit.Kilometers];

    if (!lat || !lng) {
      return next(
        new AppError(
          'Please specify correctly lantitude and longitude with comma',
          400,
        ),
      );
    }

    const tours = await Tour.find({
      startLocation: {
        $geoWithin: {
          $centerSphere: [[lng, lat], radius],
        },
      },
    });

    res.status(200).json({
      status: 'success',
      results: tours.length,
      data: { data: tours },
    });
  },
);

export const getDistances = catchAsync(
  async (
    req: Request<Pick<GetToursWithinParams, 'latlng' | 'unit'>>,
    res: Response,
    next: NextFunction,
  ) => {
    const { latlng, unit } = req.params;
    const [lat, lng] = latlng.split(',');

    if (!lat || !lng) {
      return next(
        new AppError(
          'Please specify correctly lantitude and longitude with comma',
          400,
        ),
      );
    }

    const multiplier = {
      [Unit.Miles]: 0.000621371,
      [Unit.Kilometers]: 0.001,
    };

    const distances = await Tour.aggregate([
      {
        $geoNear: {
          near: {
            type: 'Point',
            coordinates: [parseInt(lng, 10), parseInt(lat, 10)],
          },
          distanceField: 'distance',
          distanceMultiplier: multiplier[unit],
        },
      },
      {
        $project: {
          distance: 1,
          name: 1,
        },
      },
    ]);

    res.status(200).json({
      status: 'success',
      data: { data: distances },
    });
  },
);
