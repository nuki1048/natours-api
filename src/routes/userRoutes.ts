/* eslint-disable import/no-extraneous-dependencies */
import { Router } from 'express';
import { userController, authController } from '../controllers';
import { UserRoles } from '../models/userModel';

const router = Router();

router.post('/login', authController.login);

router.post('/signup', authController.signup);

router.post('/forgotPassword', authController.forgotPassword);

router.patch('/resetPassword/:token', authController.resetPassword);

// Protect all routes below that middleware
router.use(authController.protect);

router.patch('/updatePassword', authController.updatePassword);
router.get('/me', userController.getMe, userController.getUser);
router.patch(
  '/updateMe',
  userController.uploadUserPhoto,
  userController.resizeUserPhoto,
  userController.updateMe,
);
router.delete('/deleteMe', userController.deleteMe);

// Protect all routes below that middleware
router.use(authController.restrictTo(UserRoles.Admin));

router
  .route('/')
  .get(userController.getAllUsers)
  .post(userController.createUser);

router
  .route('/:id')
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

export default router;
