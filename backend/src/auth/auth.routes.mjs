import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import * as authController from './auth.controller.mjs'

const router = Router();

const emailActionLimit = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 5,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { error: "Too many requests, please try again later" },
})

router.post('/signup', authController.signupHandler);
router.post('/login', authController.loginHandler);
router.post('/refresh', authController.refreshHandler);
router.post('/logout', authController.logoutHandler);
router.get('/verify-email', authController.verifyEmailHandler);
router.post('/resend-verification', emailActionLimit, authController.resendVerificationHandler);
router.post('/forgot-password', emailActionLimit, authController.forgotPasswordHandler);
router.post('/reset-password', authController.resetPasswordHandler);

export default router;