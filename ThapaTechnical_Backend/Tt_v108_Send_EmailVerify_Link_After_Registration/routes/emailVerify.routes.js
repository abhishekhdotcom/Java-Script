import { Router } from "express";

import {
  EmailVerifyPage,
  ResendEmailVerifyLink,
  verifyEmailToken,
} from "../controllers/emailVerify.controller.js";
import verifyAuthMiddleware from "../middlewares/verifyAuth.middleware.js";

const router = Router();

// ---------Email Verify route---------
router.route("/verify-email").get(verifyAuthMiddleware, EmailVerifyPage);

// ---------Resend Email Verify Link route---------
router
  .route("/resend-email-verify-link")
  .post(verifyAuthMiddleware, ResendEmailVerifyLink);

// ---------Resend Email Verify Link route---------
router
  .route("/verify-email-token")
  .get(verifyAuthMiddleware, verifyEmailToken) // Verify Token By Click Email Link
  .post(verifyAuthMiddleware, verifyEmailToken); // Verify Token By Manually Enter

export default router;
