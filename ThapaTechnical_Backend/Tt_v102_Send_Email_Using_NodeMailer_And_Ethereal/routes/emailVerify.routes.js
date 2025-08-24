import { Router } from "express";

import {
  ResendEmailVerifyLink,
  EmailVerifyPage,
} from "../controllers/emailVerify.controller.js";
import verifyAuthMiddleware from "../middlewares/verifyAuth.middleware.js";

const router = Router();

// ---------Email Verify route---------
router.route("/verify-email").get(verifyAuthMiddleware, EmailVerifyPage);

// ---------Resend Email Verify Link route---------
router
  .route("/resend-email-verify-link")
  .post(verifyAuthMiddleware, ResendEmailVerifyLink);

export default router;
