import { Router } from 'express'
import * as authController from './auth.controller.mjs'

const router = Router();

router.post('/signup', authController.signupHandler);
router.post('/login', authController.loginHandler);
router.post('/refresh', authController.refreshHandler);
router.post('/logout', authController.logoutHandler);
router.get('/verify-email', authController.verifyEmailHandler);
router.post('/forgot-password', authController.forgotPasswordHandler);
router.post('/reset-password', authController.resetPasswordHandler);

export default router;