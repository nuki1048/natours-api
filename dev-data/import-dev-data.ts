/* eslint-disable no-console */
import fs from 'fs';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

import { Tour } from '../src/models/tourModel';
import { Review } from '../src/models/reviewModel';
import { User } from '../src/models/userModel';

dotenv.config({ path: './config.env' });

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD,
);

mongoose.connect(DB).catch((err) => console.error(err));

// Read json file

const tours = JSON.parse(
  fs.readFileSync(`${__dirname}/./data/tours.json`, 'utf-8'),
);
const users = JSON.parse(
  fs.readFileSync(`${__dirname}/./data/users.json`, 'utf-8'),
);
const reviews = JSON.parse(
  fs.readFileSync(`${__dirname}/./data/reviews.json`, 'utf-8'),
);

// Import Data into DB
const importData = async () => {
  try {
    await Tour.create(tours);
    await User.create(users, { validateBeforeSave: false });
    await Review.create(reviews);

    console.log('Data successfully loaded!');
  } catch (error) {
    console.log(error);
  }
};

//  Delete all data from Database

const deleteData = async () => {
  try {
    await Tour.deleteMany();
    await User.deleteMany();
    await Review.deleteMany();

    console.log('Data successfully deleted!');
  } catch (error) {
    console.log(error);
  }
};

const clearId = () => {
  tours.forEach((tour) => delete tour._id);
};

// eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
const [first, second, ...restArgs] = process.argv;

restArgs.forEach((argv) => {
  if (argv === '--clear') {
    clearId();
  }
  if (argv === '--import') {
    importData();
  }
  if (argv === '--delete') {
    deleteData();
  }
});
