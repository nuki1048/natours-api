# Tour Booking Platform

This project is a comprehensive solution for managing and booking tours. It is designed to provide users with a seamless experience from browsing tours to booking them. The platform includes a variety of features such as tour descriptions, user reviews, image galleries, and detailed information about tour guides.

## Features

- **Tour Browsing**: Users can browse through a wide range of tours, each with detailed descriptions, images, and reviews.
- **Dynamic Tour Information**: Each tour page dynamically displays information such as the next available date, difficulty level, maximum number of participants, and average rating.
- **Tour Guides**: Detailed information about the tour guides, including their roles (e.g., Lead guide, Tour guide, Intern), names, and photos.
- **Responsive Design**: The platform is designed to be responsive, ensuring a great user experience across all devices.

## Technology Stack

- **Frontend**: Pug templates for dynamic rendering of HTML, with custom styling for a unique look and feel.
- **Backend**: Node.js for server-side logic, including handling tour data and user interactions.
- **Database**: JSON files used for development data (e.g., `reviews.json`, `tours.json`, `users.json`), simulating a database.
- **Development Tools**: ESLint and Prettier for code quality and formatting. Nodemon for hot reloading during development.

## Project Structure

- `.eslintrc.json`, `.prettierrc`, `nodemon.json`: Configuration files for ESLint, Prettier, and Nodemon.
- `dev-data/`: Contains development data and scripts for importing data.
- `src/`: Source code for the application, including:
  - `app.ts`: Main application setup.
  - `controllers/`, `models/`, `routes/`, `utils/`: Backend logic.
  - `public/`: Static files served to the client.
  - `views/`: Pug templates for rendering HTML.
- `tsconfig.json`: TypeScript configuration file.

## Getting Started

To get started with this project, clone the repository and install the dependencies:

```sh
git clone https://github.com/nuki1048/natours-api.git
cd natours-api
npm install
npm run dev
```