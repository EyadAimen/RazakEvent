import { Router } from 'express'
import * as authController from './auth.controller.mjs'

const router = Router();

router.post('/signup', authController.signupHandler);
router.post('/login', authController.loginHandler);

export default router;