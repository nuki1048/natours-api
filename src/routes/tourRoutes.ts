import express from 'express';
import { tourController, authController } from '../controllers';
import { UserRoles } from '../models/userModel';
import reviewRouter from './reviewRoutes';

const router = express.Router();

router.use('/:tourId/reviews', reviewRouter);

router
  .route('/top-5-cheap')
  .get(tourController.aliasTopTours, tourController.getAllTours);

router.route('/tour-stats').get(tourController.getTourStats);
router
  .route('/monthly-plan/:year')
  .get(
    authController.protect,
    authController.restrictTo(
      UserRoles.Admin,
      UserRoles.Guide,
      UserRoles.LeadGuide,
    ),
    tourController.getMonthlyPlan,
  );

router
  .route('/tours-within/:distance/center/:latlng/unit/:unit')
  .get(tourController.getToursWithin);

router.route('/distances/:latlng/unit/:unit').get(tourController.getDistances);

router
  .route('/')
  .get(tourController.getAllTours)
  .post(
    authController.protect,
    authController.restrictTo(UserRoles.Admin, UserRoles.LeadGuide),
    tourController.createTour,
  );

router
  .route('/:id')
  .get(tourController.getTour)
  .patch(
    authController.protect,
    authController.restrictTo(UserRoles.Admin, UserRoles.LeadGuide),
    tourController.uploadTourImages,
    tourController.resizeTourImages,
    tourController.updateTour,
  )
  .delete(
    authController.protect,
    authController.restrictTo(UserRoles.Admin, UserRoles.LeadGuide),
    tourController.deleteTour,
  );

export default router;
