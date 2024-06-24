import mongoose, {
  CallbackWithoutResultAndOptionalError as NextFunction,
  Model,
  Schema,
} from 'mongoose';
import { Tour } from './tourModel';

export interface ReviewInterface {
  review: string;
  rating: number;
  createAt: number;
  tour: typeof Schema.ObjectId;
  user: typeof Schema.ObjectId;
}
export interface ReviewMethods {}

export interface IReview extends Model<ReviewInterface, object, ReviewMethods> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  calcAverageRating: (tourId: string) => any;
}

interface ReviewPipeline {
  tour: string;
  nRating: number;
  avgRating: number;
}

const reviewSchema = new Schema<ReviewInterface, IReview, ReviewMethods>(
  {
    review: { type: String, required: [true, 'Review cannot be empty!'] },
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    createAt: {
      type: Number,
      default: Date.now,
    },
    tour: {
      type: Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'Review must be belong to a tour!'],
    },
    user: {
      type: Schema.ObjectId,
      ref: 'User',
      required: [true, 'Review must have a author of it!'],
    },
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

reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

reviewSchema.pre('find', function (next: NextFunction) {
  this.populate({
    path: 'user',
    select: 'name photo',
  });

  next();
});

reviewSchema.statics.calcAverageRating = async function (tourId: string) {
  const stats: ReviewPipeline[] = await this.aggregate([
    {
      $match: {
        tour: tourId,
      },
    },
    {
      $group: {
        _id: '$tour',
        nRating: { $sum: 1 },
        avgRating: { $avg: '$rating' },
      },
    },
  ]);

  await Tour.findByIdAndUpdate(tourId, {
    ratingsAverage: stats[0].avgRating ?? 0,
    ratingsQuantity: stats[0].nRating ?? 0,
  });
};

reviewSchema.post('save', async function () {
  await (this.constructor as IReview).calcAverageRating(
    this.tour as unknown as string,
  );
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface QueryWithR extends mongoose.Query<any, any, object, any, RegExp> {
  r: ReviewInterface;
}

reviewSchema.pre<QueryWithR>(
  /^findOneAnd/ as RegExp,
  async function (next: NextFunction) {
    this.r = await this.clone().findOne();
    next();
  },
);

reviewSchema.post<QueryWithR>(/^findOneAnd/ as RegExp, async function () {
  await (this.r.constructor as IReview).calcAverageRating(
    this.r.tour as unknown as string,
  );
});

export const Review = mongoose.model<ReviewInterface, IReview>(
  'Review',
  reviewSchema,
);
