import mongoose, {
  CallbackWithoutResultAndOptionalError as NextFunction,
} from 'mongoose';
import validator from 'validator';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

interface IUserMethods {
  correctPassword: (
    candidatePassword: string,
    userPassword: string,
  ) => Promise<boolean>;
  changedPasswordAfter: (JWTTimeStamp: number) => boolean;
  createPasswordResetToken: () => string;
}

export enum UserRoles {
  Admin = 'admin',
  User = 'user',
  LeadGuide = 'lead-guide',
  Guide = 'guide',
}

export interface IUser extends mongoose.Document, IUserMethods {
  name: string;
  email: string;
  photo: string;
  role: UserRoles;
  password: string | undefined;
  passwordConfirm: string | undefined;
  passwordChangedAt: number;
  passwordResetToken: string | undefined;
  passwordResetExpires: Date | undefined;
  active: boolean;
}

const errorMessages = {
  NAME: {
    REQUIRED: 'User must have a name!',
  },
  EMAIL: {
    INVALID: 'Invalid email format.',
    REQUIRED: 'User must have an email!',
  },
  PASSWORD: {
    REQUIRED: 'User must have a password',
    INVALID:
      'Password needs to have one uppercase letter, one lowercase letter, one special character, one number, and be at least 8 characters long. Maximum length is 30 characters.',
  },
  PASSWORD_CONFIRM: {
    REQUIRED: 'You need to confirm your password!',
    INVALID: 'Passwords needs to be equal each other!',
  },
};

const SALT_LEVEL = 12;
const userSchema = new mongoose.Schema<IUser>({
  name: {
    type: String,
    required: [true, errorMessages.NAME.REQUIRED],
  },
  email: {
    type: String,
    unique: true,
    required: [true, errorMessages.EMAIL.REQUIRED],
    validate: {
      validator: function (this: IUser, val: string) {
        return validator.isEmail(val);
      },
      message: errorMessages.EMAIL.INVALID,
    },
    lowercase: true,
  },
  photo: { type: String, default: 'default.jpg' },
  role: {
    type: String,
    enum: Object.values(UserRoles),
    default: UserRoles.User,
  },
  password: {
    type: String,
    required: [true, errorMessages.PASSWORD.REQUIRED],
    validate: [validator.isStrongPassword, errorMessages.PASSWORD.INVALID],
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: [true, errorMessages.PASSWORD_CONFIRM.REQUIRED],
    validate: {
      validator: function (this: IUser, val: string) {
        return this.password === val;
      },
      message: errorMessages.PASSWORD_CONFIRM.INVALID,
    },
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
});

userSchema.pre('find', function (next: NextFunction) {
  this.find({ active: { $ne: false } });

  next();
});

// For encrypting password
userSchema.pre('save', async function (next: NextFunction) {
  const isPasswordModified = this.isModified('password');

  if (!isPasswordModified) {
    return next();
  }

  this.password = await bcrypt.hash(this.password as string, SALT_LEVEL);
  this.passwordConfirm = undefined;
  next();
});

// For password changing
userSchema.pre('save', async function (next: NextFunction) {
  const isPasswordModified = this.isModified('password');

  if (!isPasswordModified || this.isNew) {
    return next();
  }

  this.passwordChangedAt = Date.now() - 1000;
  next();
});

userSchema.methods.correctPassword = function (
  candidatePassword: string,
  userPassword: string,
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changedPasswordAfter = function (
  JWTTimeStamp: number,
): boolean {
  // Case when user never changed his password
  if (!this.passwordChangedAt) {
    return false;
  }

  const changedTimestamp = this.passwordChangedAt.getTime() / 1000;
  return JWTTimeStamp < changedTimestamp;
};

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

export const User: mongoose.Model<IUser> = mongoose.model('User', userSchema);
