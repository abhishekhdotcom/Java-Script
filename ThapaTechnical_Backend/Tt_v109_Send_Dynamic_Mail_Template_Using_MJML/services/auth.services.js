import { db } from "../config/db.js";
import { sql, and, eq, gte, lt } from "drizzle-orm";
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
import { sendEmail } from "../lib/nodemailer.js";
import fs from "fs/promises";
import path from "path"; // Node.js module for handling file paths
import { fileURLToPath } from "url"; // Convert ES module URLs to file paths
import ejs from "ejs";
import mjml2html from "mjml";

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

// -------------Generate Email Verify Link using URL API-------------
export const createVerifyEmailLink = async ({ email, token }) => {
  try {
    const baseUrl = "http://localhost:3000"; // FrontEnd base URL
    const url = new URL(`${baseUrl}/api/v1/verify/verify-email-token`);

    url.searchParams.append("token", token);
    url.searchParams.append("email", email);

    return url.toString();
  } catch (error) {
    console.error("Error generating verify email link:", error);
    throw new Error("Could not generate verify email link");
  }
};

// --------------Verify Email Link Token for Verify Email Address Using (Drizzle Joins)--------------
export const EmailTokenVerify = async ({ token, email }) => {
  try {
    // find token from DB
    const tokenData = await db
      .select({
        id: usersTable.id,
        email: usersTable.email,
        token: verifyEmailTable.token,
        expiresAt: verifyEmailTable.expiresAt,
      })
      .from(verifyEmailTable)
      .where(
        and(
          eq(verifyEmailTable.token, token), // Verify Token matches
          eq(usersTable.email, email), // Verify email matches
          gte(verifyEmailTable.expiresAt, sql`CURRENT_TIMESTAMP`)
        )
      )
      .innerJoin(usersTable, eq(verifyEmailTable.userId, usersTable.id)) // Inner Join
      .limit(1); // Only one record is returned

    // if Not Token Found Return NULL
    if (tokenData.length === 0) {
      throw new Error("Invalid or expired token");
    }

    return tokenData[0]; // Return the first record
  } catch (error) {
    console.error("Error verifying email token:", error);
    throw new Error("Failed to verify email token");
  }
};

// --------------Find User By Email And Update IsEmailValid = TRUE--------------
export const findUserByEmailAndSetUserEmailvalid = async (email) => {
  return await db
    .update(usersTable)
    .set({ isValidEmail: true })
    .where(eq(usersTable.email, email));
};

// -----------------Remove Verified Email Token After Verification Complite-----------------
export const removeVerifiedEmailToken = async (userId) => {
  return await db
    .delete(verifyEmailTable)
    .where(eq(verifyEmailTable.userId, userId))
    .execute();
};

// -----------------Send Email verification Link-----------------
export const sendEmailVerificationLink = async ({ userData }) => {
  // Generate 8-Digit Random Token
  const randomToken = await GenerateRandomToken();

  // Insert Token In Verify Email Table
  await insertVerifyEmailToken({ userId: userData.id, token: randomToken });

  // Create VerifyEmail Link
  const verifyEmailLink = await createVerifyEmailLink({
    email: userData.email,
    token: randomToken,
  });

  // Read the MJML template file from emails folder
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  // Full path to the MJML template
  const templatePath = path.join(__dirname, "../emails", "verify-email.mjml");

  // Read the file asynchronously (returns string directly)
  const mjmlContent = await fs.readFile(templatePath, "utf8");

  // Replace placeholders with dynamic values (update placeholders in MJML to match, e.g., <%= token %> and <%= link %>)
  const filledTemplate = ejs.render(mjmlContent, {
    token: randomToken,
    link: verifyEmailLink,
  });

  // convert MJML to HTML
  const htmlEmailTemplate = mjml2html(filledTemplate).html;

  // Send Email With VerifyToken & VerifyEmailLink for Email Address Verification
  await sendEmail({
    to: `${userData.email}`,
    subject: "Verify Your Email ✔",
    html: `${htmlEmailTemplate}`,
  });
};
