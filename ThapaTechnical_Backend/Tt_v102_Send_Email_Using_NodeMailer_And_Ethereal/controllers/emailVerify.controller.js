import {
  GenerateRandomToken,
  insertVerifyEmailToken,
  createVerifyEmailLink,
} from "../services/auth.services.js";
import { sendEmail } from "../lib/nodemailer.js";

// -------------------Render Email verify page-------------------
export const EmailVerifyPage = (req, res) => {
  let success = req.flash("success"); // Retrieve success flash messages

  // if Email Already Verified
  if (req.user.isValidEmail) {
    return res.redirect("/api/v1/auth/profile");
  }

  res.render("verifyEmail", { user: req.user, success });
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
