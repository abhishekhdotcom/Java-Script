import { Router } from "express";

import {
  registerPage,
  registerUser,
  loginPage,
  loginUser,
  profilePage,
} from "../controllers/auth.controller.js";
import verifyAuthMiddleware from "../middlewares/verifyAuth.middleware.js";

const router = Router();

// ---------Register route---------
router.route("/register").get(registerPage).post(registerUser);

// ---------Login route---------
router.route("/login").get(loginPage).post(loginUser);

// ---------Profile route---------
router.route("/profile").get(verifyAuthMiddleware, profilePage);

export default router;
