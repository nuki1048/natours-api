import { Router } from 'express';
import * as viewsController from '../controllers/viewController';
import { authController } from '../controllers';

const router = Router();

router.get('/', authController.isLoggedIn, viewsController.getOverviewTemplate);
router.get(
  '/tour/:id',
  authController.isLoggedIn,
  viewsController.getTourTemplate,
);
router.get('/login', authController.isLoggedIn, viewsController.getLoginForm);
router.get('/me', authController.isLoggedIn, viewsController.getAccount);

router.post(
  '/submit-user-data',
  authController.isLoggedIn,
  viewsController.updateUserData,
);

export default router;
