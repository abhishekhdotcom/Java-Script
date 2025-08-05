import { Router } from "express";

import {
  registerPage,
  registerUser,
  loginPage,
  loginUser,
  profilePage,
} from "../controllers/auth.controller.js";

const router = Router();

// ---------Register route---------
router.route("/register").get(registerPage).post(registerUser);

// ---------Login route---------
router.route("/login").get(loginPage).post(loginUser);

// ---------Login route---------
router.route("/profile").get(profilePage);

export default router;
