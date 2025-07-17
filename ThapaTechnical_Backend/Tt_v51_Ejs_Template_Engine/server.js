import express from "express";
import path from "path"; // Node.js module for handling file paths
import { fileURLToPath } from "url"; // Convert ES module URLs to file paths
import dotenv from "dotenv";

const app = express();
dotenv.config(); // Load environment variables from .env file
const PORT = process.env.PORT || 8081;

app.set("view engine", "ejs"); // EJS templates will be used for dynamic HTML

// Derive __filename and __dirname for ES modules
const __filename = fileURLToPath(import.meta.url); // Get the current file's path
const __dirname = path.dirname(__filename); // Get the directory of the current file

// --------Middleware setup--------
app.use(express.json()); // For JSON payloads
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded form data
app.use(express.static(path.join(__dirname, "public"))); // Serve static files from the 'public' folder

app.get("/", async (req, res) => {
  res.send("Ejs Template Engine!");
});

app.get("/reports", async (req, res) => {
  // Static Data
  const studentData = [
    { name: "Thapa", age: 29, subject: "Java Programming" },
    { name: "Abhi", age: 23, subject: "C++ Programming" },
    { name: "Hitesh", age: 38, subject: "JavaScript Programming" },
    { name: "Harry", age: 27, subject: "C Programming" },
    { name: "Harsh", age: 28, subject: "Python Programming" },
    { name: "Sharadha", age: 27, subject: "Rubi Programming" },
  ];
  res.render("reportCard", { studentData });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
