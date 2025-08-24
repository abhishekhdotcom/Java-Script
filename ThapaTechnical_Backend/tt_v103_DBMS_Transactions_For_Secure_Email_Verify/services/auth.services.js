import { db } from "../config/db.js";
import { eq, lt } from "drizzle-orm";
import argon2 from "argon2";
import jwt from "jsonwebtoken";
import {
  sessionsTable,
  usersTable,
  verifyEmailTable,
} from "../drizzle/schema.js";
import {
  ACCESS_TOKEN_EXPIRY,
  MILLISECONDS_PER_SECOND,
  REFRESH_TOKEN_EXPIRY,
} from "../config/constants.js";
import crypto from "crypto";
import { sql } from "drizzle-orm";

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

// -------------AuthenticateUser use in Register, Login Controller And VerifyAuth.middleware----------------
export const authenticateUser = async ({ user, req, res }) => {
  // Create a Sessions
  const session = await createSession(user.id, {
    ip: req.clientIp, // works with request-ip middleware
    userAgent: req.headers["user-agent"],
  });

  // JWT payload
  const payload = {
    id: user.id,
    name: user.name,
    email: user.email,
    sessionId: session.sessionId,
  };

  // Generate AccessToken
  const accessToken = generateAccessToken(payload);

  // Generate RefreshToken
  const refreshToken = generateRefreshToken(session.sessionId);

  // Set AccessToken & RefreshToken In Cookies
  const baseConfig = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", // Secure in production
    sameSite: "lax", // Allows POST + redirect from your own site
  };

  res.cookie("accessToken", accessToken, {
    ...baseConfig,
    maxAge: ACCESS_TOKEN_EXPIRY,
  });

  res.cookie("refreshToken", refreshToken, {
    ...baseConfig,
    maxAge: REFRESH_TOKEN_EXPIRY,
  });

  // Return session + tokens so middleware/controllers can use it
  return {
    session,
  };
};

// ----------------Generate 8-Digit Random Token For Store Email-Verify----------------
export const GenerateRandomToken = async () => {
  const buffer = crypto.randomBytes(4); // 4 bytes = 32 bits ≈ 8 digits
  const token = (buffer.readUInt32BE(0) % 100000000)
    .toString()
    .padStart(8, "0");
  return token;
};

// -----------------Insert Token In Verify Email Table-----------------
export const insertVerifyEmailToken = async ({ userId, token }) => {
  // DBMS Transaction for Secure Email Verification
  return db.transaction(async (tx) => {
    try {
      // Delete Expires Token From VerifyEmail Tables
      await tx
        .delete(verifyEmailTable)
        .where(lt(verifyEmailTable.expiresAt, sql`CURRENT_TIMESTAMP`))
        .execute();

      // Delete Existing tokens for this specific user
      await tx
        .delete(verifyEmailTable)
        .where(eq(verifyEmailTable.userId, userId))
        .execute();

      // Insert New Token
      return await tx.insert(verifyEmailTable).values({ userId, token });
    } catch (error) {
      console.error("failed to insert verification Token: ", error);
      throw new Error("Unable to create Verification Token!");
    }
  });
};

// -------------Generate Email Verify Link-------------
export const createVerifyEmailLink = async ({ email, token }) => {
  try {
    const baseUrl = "http://localhost:3000";

    // Encode email to avoid issues with special chars
    const encodedEmail = encodeURIComponent(email);

    // Construct verification link
    const verifyLink = `${baseUrl}/verify-email-token?email=${encodedEmail}&token=${token}`;

    return verifyLink;
  } catch (error) {
    console.error("Error generating verify email link:", error);
    throw new Error("Could not generate verify email link");
  }
};
