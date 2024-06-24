import mongoose, {
  CallbackWithoutResultAndOptionalError as MongooseNextFunction,
  Schema,
} from 'mongoose';
// eslint-disable-next-line import/no-extraneous-dependencies
import { Tour as TSTour, Location } from '../global/interfaces';

export interface ITour extends TSTour {
  priceDiscount: number;
  createdAt: Date;
  secretTour: boolean;
}

enum Difficulty {
  Easy = 'easy',
  Medium = 'medium',
  Difficult = 'difficult',
}

enum CoordinatesType {
  Point = 'Point',
}

const locationSchema = new Schema<Location>({
  description: String,
  type: String,
  coordinates: [Number],
  day: Number,
});

const tourSchema = new Schema<ITour>(
  {
    name: {
      type: String,
      required: [true, 'A tour must have a name'],
      unique: true,
      trim: true,
      maxlength: [40, 'A tour name must have less or equal than 40 characters'],
      minlength: [10, 'A tour name must have more or equal than 10 characters'],
      // validate: [validator.isAlpha, 'Tour name must only contain characters'],
    },
    slug: {
      type: String,
    },
    duration: {
      type: Number,
      required: [true, 'A tour must have a duration'],
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a group size'],
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have a difficulty'],
      enum: {
        values: Object.values(Difficulty),
        message: 'Difficulty is either: easy, medium, difficult',
      },
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Rating must be above 1.0'],
      max: [5, 'Rating must be below 5.0'],
      set: (val: number) => Math.round(val * 10) / 10,
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, 'A tour must have a price'],
    },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function (this: ITour, val: number) {
          // this only points to current doc on NEW document creation
          return val < this.price;
        },
        message: 'Discount price ({VALUE}) should be below regular price',
      },
    },
    summary: {
      type: String,
      trim: true,
      required: [true, 'A tour must have a description'],
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String,
      required: [true, 'A tour must have a cover image'],
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false,
    },
    startDates: [Date],
    secretTour: {
      type: Boolean,
      default: false,
    },
    startLocation: {
      // GeoJson
      description: String,
      type: {
        type: String,
        default: 'Point',
        enum: {
          values: Object.values(CoordinatesType),
          message: 'Type of coordinates must be only as Coordinates enum',
        },
      },
      coordinates: [Number],
      address: String,
    },
    locations: [locationSchema],
    guides: [{ type: mongoose.Schema.ObjectId, ref: 'User' }],
  },
  {
    toJSON: {
      virtuals: true,
    },
    toObject: {
      virtuals: true,
    },
  },
);

const DAYS_IN_WEEK = 7;

tourSchema.index({ price: 1, ratingsAverage: -1 });
tourSchema.index({ slug: 1 });
tourSchema.index({ startLocation: '2dsphere' });

tourSchema.virtual('durationWeeks').get(function () {
  return this.duration / DAYS_IN_WEEK;
});

tourSchema.virtual('reviews', {
  ref: 'Review',
  localField: '_id',
  foreignField: 'tour',
});

tourSchema.pre('find', function (next: MongooseNextFunction) {
  this.find({ secretTour: { $ne: true } });

  next();
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
tourSchema.pre<any>(/^find/ as RegExp, function (next: MongooseNextFunction) {
  this.populate({
    path: 'guides',
    select: '-__v -passwordChagedAt',
  });

  next();
});

export const Tour = mongoose.model('Tour', tourSchema);
