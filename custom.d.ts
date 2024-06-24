import { IUser } from './src/models/userModel';

declare global {
  namespace Express {
    interface Request {
      user?: IUser;
      files?:
        | {
            imageCover: Multer.File[];
            images: Multer.File[];
          }
        | Multer.File[]
        | undefined;
    }
  }
}
