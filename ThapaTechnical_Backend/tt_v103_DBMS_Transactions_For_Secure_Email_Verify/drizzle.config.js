import dotenv from "dotenv";
import { defineConfig } from "drizzle-kit";

dotenv.config(); // config .env

export default defineConfig({
  out: "./drizzle",
  schema: "./drizzle/schema.js",
  dialect: "mysql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});
