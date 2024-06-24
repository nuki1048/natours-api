/* eslint-disable no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextFunction, Request, Response } from 'express';
import { Model } from 'mongoose';
// eslint-disable-next-line import/no-extraneous-dependencies
import multer, { FileFilterCallback } from 'multer';
// eslint-disable-next-line import/no-extraneous-dependencies
import sharp from 'sharp';
import { catchAsync } from '../utils/catchAsync';
import { IUser, User } from '../models/userModel';
import { AppError } from '../utils/appError';
import * as factory from './handlerFactory';

// const multerStorage = multer.diskStorage({
//   destination: (
//     req: Request,
//     file: Express.Multer.File,
//     cb: (error: Error | null, destination: string) => void,
//   ) => {
//     cb(null, 'src/public/img/users');
//   },
//   filename: (
//     req: Request,
//     file: Express.Multer.File,
//     cb: (error: Error | null, destination: string) => void,
//   ) => {
//     const { user } = req;
//     const { id } = user as IUser;
//     const ext = file.mimetype.split('/')[1];

//     cb(null, `user-${id}-${Date.now()}.${ext}`);
//   },
// });
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

export const uploadUserPhoto = upload.single('photo');

export const resizeUserPhoto = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.file) return next();

    const { user } = req;
    const { id } = user as IUser;

    const timestamp = new Date()
      .toISOString()
      .replace(/[^a-zA-Z0-9_\\-]/g, '-');
    req.file.filename = `user-${id}-${timestamp}.jpeg`;

    await sharp(req.file.buffer)
      .resize(500, 500, { fit: 'cover' })
      .toFormat('jpeg')
      .jpeg({ quality: 90 })

      .toFile(`src/public/img/users/${req.file.filename}`);

    next();
  },
);

const filterObj = (object: object, ...allowedFields: string[]) => {
  return Object.fromEntries(
    Object.entries(object).filter(([key]) => allowedFields.includes(key)),
  );
};

export const updateMe = catchAsync(
  async (
    req: Request<
      object,
      object,
      Partial<Pick<IUser, 'password' | 'passwordConfirm' | 'email' | 'name'>>
    >,
    res: Response,
    next: NextFunction,
  ) => {
    const { password, passwordConfirm } = req.body;
    if (password || passwordConfirm) {
      next(
        new AppError(
          'This route is not for password updates. Please user /updatePassword',
          403,
        ),
      );
    }

    const filteredBody = filterObj(req.body, 'name', 'email');

    if (req.file) filteredBody.photo = req.file.filename;

    const updatedUser = await User.findByIdAndUpdate(
      req?.user?.id,
      filteredBody,
      {
        new: true,
        runValidators: true,
      },
    );

    res.status(200).json({
      status: 'success',
      data: {
        user: updatedUser,
      },
    });
  },
);

export const deleteMe = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    await User.findByIdAndUpdate(req?.user?.id, { active: false });

    res.status(204).json({
      status: 'success',
      data: null,
    });
  },
);

export const getMe = (req: Request, res: Response, next: NextFunction) => {
  req.params.id = req?.user?.id;
  next();
};

// Do NOT update passwords with this
export const updateUser = factory.updateOne(User as unknown as Model<unknown>);
export const deleteUser = factory.deleteOne(User as unknown as Model<unknown>);
export const getAllUsers = factory.getAll(User as unknown as Model<unknown>);
export const getUser = factory.getOne(User as unknown as Model<unknown>);
export const createUser = (req: Request, res: Response) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not defined! Please use /signup instead',
  });
};
