import { Router } from 'express';
import { reviewsController, authController } from '../controllers';
import { UserRoles } from '../models/userModel';

const router = Router({ mergeParams: true });

router.use(authController.protect);

router
  .route('/')
  .get(reviewsController.getAllReviews)
  .post(
    authController.restrictTo(UserRoles.User),
    reviewsController.setTourAndUserIds,
    reviewsController.createReview,
  );

router
  .route('/:id')
  .get(reviewsController.getReview)
  .patch(
    authController.restrictTo(UserRoles.User, UserRoles.Admin),
    reviewsController.updateReview,
  )
  .delete(
    authController.restrictTo(UserRoles.User, UserRoles.Admin),
    reviewsController.deleteReview,
  );

export default router;
