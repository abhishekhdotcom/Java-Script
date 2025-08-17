import { Router } from "express";

import {
  registerPage,
  registerUser,
  loginPage,
  loginUser,
  profilePage,
  EmailVerifyPage,
} from "../controllers/auth.controller.js";
import verifyAuthMiddleware from "../middlewares/verifyAuth.middleware.js";

const router = Router();

// ---------Register route---------
router.route("/register").get(registerPage).post(registerUser);

// ---------Login route---------
router.route("/login").get(loginPage).post(loginUser);

// ---------Profile route---------
router.route("/profile").get(verifyAuthMiddleware, profilePage);

// ---------Email Verify route---------
router.route("/verify-email").get(verifyAuthMiddleware, EmailVerifyPage);

export default router;
