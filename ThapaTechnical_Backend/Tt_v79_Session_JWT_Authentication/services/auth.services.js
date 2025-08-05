import { db } from "../config/db.js";
import { eq } from "drizzle-orm";
import argon2 from "argon2";
import jwt from "jsonwebtoken";
import { usersTable } from "../drizzle/schema.js";

// --------------Get User from DB by Email---------------
export const getUserByEmail = async (email) => {
  // Get user from DB
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, email));

  return user;
};

// --------------Create User store data in DB---------------
export const createUser = async ({ name, age, email, password }) => {
  // Insert data in DB
  return await db
    .insert(usersTable)
    .values({ name, age, email, password })
    .$returningId();
};

// ------------------Password hashing & Verify with Argon2------------------
export const hashPassword = async (password) => {
  return await argon2.hash(password);
};

export const comparePassword = async (password, hashedPassword) => {
  return await argon2.verify(hashedPassword, password);
};

// --------------JWT Token generate---------------
export const generateToken = (payload) => {
  // Generate new JWT token
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "30d" });
};
