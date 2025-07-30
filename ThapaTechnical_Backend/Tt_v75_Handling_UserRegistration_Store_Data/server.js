import express from "express";
import path from "path"; // Node.js module for handling file paths
import { fileURLToPath } from "url"; // Convert ES module URLs to file paths
import dotenv from "dotenv";
import cookieParser from "cookie-parser";

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

// routes
import authRouter from "./routes/auth.routes.js";

// routes decleration
app.use("/api/v1/auth", authRouter);

// Start the server and listen on specified port
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`); // Log server start with port
});
