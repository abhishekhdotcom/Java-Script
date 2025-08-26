import express from "express";
import path from "path"; // Node.js module for handling file paths
import { fileURLToPath } from "url"; // Convert ES module URLs to file paths
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import session from "express-session";
import flash from "connect-flash";
import requestIp from "request-ip";
import {
  deleteSessionById,
  verifyAccessToken,
} from "./services/auth.services.js";

const app = express(); // Initialize Express app
dotenv.config(); // Load environment variables from .env file
const port = process.env.PORT || 3000;

app.set("view engine", "ejs"); // EJS templates will be used for dynamic HTML

// Derive __filename and __dirname for ES modules
const __filename = fileURLToPath(import.meta.url); // Get the current file's path
const __dirname = path.dirname(__filename); // Get the directory of the current file

// --------Middleware setup--------
app.use(express.json({ limit: "16kb" })); // Parse incoming JSON payloads
app.use(express.urlencoded({ extended: true, limit: "16kb" })); // Parse URL-encoded form data
app.use(express.static(path.join(__dirname, "public"))); // Serve static files from the 'public' directory
app.use(cookieParser()); // cookie parser

// Session configuration
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true, // prevent client-side JS from touching cookie
      secure: process.env.NODE_ENV === "production", // only https in production
      sameSite: "lax", // works with normal POST/redirect flows
    },
  })
);
app.use(flash()); // Initialize connect-flash
app.use(requestIp.mw()); // Get Client IP Address

// Index Route (Home-Page)
app.get("/", (req, res) => {
  let success = req.flash("success"); // Retrieve success flash messages
  let user = null;

  if (req.cookies?.accessToken) {
    try {
      const decoded = verifyAccessToken(req.cookies.accessToken);
      user = decoded;
    } catch (err) {
      console.error("Access token error:", err.message);
      res.clearCookie("accessToken");
    }
  }
  res.render("index", { user, success });
});

// Logout (POST for security)
app.post("/logout", async (req, res) => {
  let user = null;

  if (req.cookies?.accessToken) {
    try {
      const decoded = verifyAccessToken(req.cookies.accessToken);
      user = decoded;
    } catch (err) {
      console.error("Access token error:", err.message);
      res.clearCookie("accessToken");
    }
  }

  // Clean up old session
  await deleteSessionById(user.sessionId);

  res.clearCookie("accessToken");
  res.clearCookie("refreshToken");

  // Show Flash message
  req.flash("success", "LogOut Successfully!");
  return res.redirect("/");
});

// routes
import authRouter from "./routes/auth.routes.js";
import verifyEmail from "./routes/emailVerify.routes.js";

// routes decleration
app.use("/api/v1/auth", authRouter);

// routes decleration
app.use("/api/v1/verify", verifyEmail);

// Start the server and listen on specified port
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`); // Log server start with port
});
