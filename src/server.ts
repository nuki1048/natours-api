/* eslint-disable no-console */
import mongoose from 'mongoose';
import dotenv from 'dotenv';

const EXIT_CODE = 1;

process.on('uncaughtException', (err) => {
  console.log('UNHANDLED EXEPTION! 💥 Shutting down...');
  console.log(`ERROR💥:`, err.name, err.message);
  process.exit(EXIT_CODE);
});

dotenv.config({ path: './config.env' });

// eslint-disable-next-line import/first
import app from './app';

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD,
);

mongoose.connect(DB);

const PORT = process.env.PORT || 8000;

const server = app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}🤝. http://localhost:8000`);
});

process.on('unhandledRejection', (err) => {
  console.log(`ERROR💥:`, err);
  console.log('UNHANDLED REJECTION! 💥 Shutting down...');
  server.close(() => {
    process.exit(EXIT_CODE);
  });
});
