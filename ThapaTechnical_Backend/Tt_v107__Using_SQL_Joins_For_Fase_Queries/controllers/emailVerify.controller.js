import {
  GenerateRandomToken,
  insertVerifyEmailToken,
  createVerifyEmailLink,
  EmailTokenVerify,
  findUserByEmailAndSetUserEmailvalid,
  removeVerifiedEmailToken,
} from "../services/auth.services.js";
import { sendEmail } from "../lib/nodemailer.js";
import { verifyEmailTokenSchema } from "../validators/auth.validator.js";
import { db } from "../config/db.js";
import { verifyEmailTable } from "../drizzle/schema.js";
import { eq } from "drizzle-orm";

// -------------------Render Email verify page-------------------
export const EmailVerifyPage = async (req, res) => {
  // if Email Already Verified
  if (req.user.isValidEmail) {
    return res.redirect("/api/v1/auth/profile");
  }

  // Check Verify Email Token Exist or Not
  const tokenExist = await db
    .select({
      userId: verifyEmailTable.userId,
    })
    .from(verifyEmailTable)
    .where(eq(verifyEmailTable.userId, req.user.id));

  res.render("verifyEmail", { user: req.user, tokenExist });
};

// -------------------Resend Email Verify Email Link-------------------
export const ResendEmailVerifyLink = async (req, res) => {
  if (!req.user.id) {
    return res.redirect("/api/v1/auth/login");
  }

  try {
    // Generate 8-Digit Random Token
    const randomToken = await GenerateRandomToken();

    // Insert Token In Verify Email Table
    await insertVerifyEmailToken({ userId: req.user.id, token: randomToken });

    // Create VerifyEmail Link
    const verifyEmailLink = await createVerifyEmailLink({
      email: req.user.email,
      token: randomToken,
    });

    // Send Email With VerifyToken & VerifyEmailLink for Email Address Verification
    await sendEmail({
      to: `${req.user.email}`,
      subject: "Verify Your Email ✔",
      html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333;">Verify Your Email</h1>
          <p>Use this code: <strong style="font-family: monospace;">${randomToken}</strong></p>
          <p>Or click the button below:</p>
          <a href="${verifyEmailLink}" style="display: inline-block; padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px;">Verify Email</a>
          <p style="color: #777;">This link expires in 24 hours.</p>
        </div>`,
    });

    // return Verify Email Link Send successfully
    res.json({
      success: true,
      message: "Verification link sent successfully!",
    });
  } catch (error) {
    console.error("Error resending verification email:", error);
    res.status(500).json({
      success: false,
      message: "Failed to resend verification email. Please try again later.",
    });
  }
};

// -------------------Verify Email Token-------------------
export const verifyEmailToken = async (req, res) => {
  // Use req.body for POST, req.query for GET
  const params = req.method === "POST" ? req.body : req.query;

  // Zod validation
  const { data, error } = verifyEmailTokenSchema.safeParse(params);

  if (error) {
    return res.send("verification Link Invalid Or Expired!");
  }

  // Verify Email Link Token for Verify Email Address
  const emailVerifiedData = await EmailTokenVerify(data);
  
  if (!emailVerifiedData) {
    return res.send("verification Link Invalid Or Expired!");
  }

  // Find User By Email And Update IsEmailValid = TRUE
  await findUserByEmailAndSetUserEmailvalid(emailVerifiedData.email);

  // Remove Verified Email Token After Verification Complite
  await removeVerifiedEmailToken(emailVerifiedData.userId);

  // Redirect After Email Token Verification Successfull
  if (req.method === "POST") {
    return res.status(200).json({
      success: true,
      message: "Email verified successfully",
    });
  }

  return res.redirect("/api/v1/auth/profile");
};
