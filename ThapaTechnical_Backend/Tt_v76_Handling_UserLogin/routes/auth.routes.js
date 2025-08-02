import { Router } from "express";

import {
  registerPage,
  registerUser,
  loginPage,
  loginUser,
} from "../controllers/auth.controller.js";

const router = Router();

// ---------Register route---------
router.route("/register").get(registerPage).post(registerUser);

// ---------Login route---------
router.route("/login").get(loginPage).post(loginUser);

export default router;
