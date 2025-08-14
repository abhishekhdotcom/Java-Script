import { db } from "../config/db.js";
import { eq } from "drizzle-orm";
import argon2 from "argon2";
import jwt from "jsonwebtoken";
import { sessionsTable, usersTable } from "../drizzle/schema.js";
import {
  ACCESS_TOKEN_EXPIRY,
  MILLISECONDS_PER_SECOND,
  REFRESH_TOKEN_EXPIRY,
} from "../config/constants.js";

// --------------Get User from DB by Email---------------
export const getUserByEmail = async (email) => {
  // Get user from DB
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, email));

  return user;
};

// --------------Get User from DB by Id---------------
export const getUserById = async (userId) => {
  // Get user from DB
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, userId));

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

// -------------Create Session---------------
export const createSession = async (userId, { ip, userAgent }) => {
  const [session] = await db
    .insert(sessionsTable)
    .values({ userId, ip, userAgent })
    .$returningId();

  return session;
};

// ----------------Find session by sessionId----------------
export const findSessionById = async (sessionId) => {
  // find session from DB
  const [session] = await db
    .select()
    .from(sessionsTable)
    .where(eq(sessionsTable.sessionId, sessionId));

  return session;
};

// ----------------Delete Session by sessionId----------------
export const deleteSessionById = async (sessionId) => {
  const [deletedSession] = await db
    .delete(sessionsTable)
    .where(eq(sessionsTable.sessionId, sessionId))
    .execute();

  return deletedSession;
};

// ----------------Generate AccessToken--------------
export const generateAccessToken = (payload) => {
  // Generate new JWT token
  return jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRY / MILLISECONDS_PER_SECOND, // ExpiresIn: "15m"
  });
};

// ----------------Generate RefreshToken--------------
export const generateRefreshToken = (sessionId) => {
  // Generate new JWT token
  return jwt.sign({ sessionId }, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRY / MILLISECONDS_PER_SECOND, // ExpiresIn: "7d"
  });
};

// ---------------JWT Access Token Verify ----------------
export const verifyAccessToken = (accessToken) => {
  return jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
};

// ---------------JWT Refresh Token Verify ----------------
export const verifyRefreshToken = (refreshToken) => {
  return jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
};
