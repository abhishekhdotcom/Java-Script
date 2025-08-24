import {
  GenerateRandomToken,
  insertVerifyEmailToken,
  createVerifyEmailLink,
} from "../services/auth.services.js";
import { sendEmail } from "../lib/nodemailer.js";

// -------------------Render Email verify page-------------------
export const EmailVerifyPage = (req, res) => {
  // if Email Already Verified
  if (req.user.isValidEmail) {
    return res.redirect("/api/v1/auth/profile");
  }

  res.render("verifyEmail", { user: req.user });
};

// -------------------Resend Email Verify Email Link-------------------
export const ResendEmailVerifyLink = async (req, res) => {
  if (!req.user.id) {
    return res.redirect("/api/v1/auth/login");
  }

  console.log("Resend Email Verification Link!");

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
    html: `<h1>Click the link below to verify your email.</h1>
             <p>You can use this token: <code>${randomToken}</code></p>
             <a href="${verifyEmailLink}">Verify Email...</a>`,
  }).catch(console.error);

  // return Verify Email Link Send successfully
  return res.redirect("/api/v1/auth/verify-email");
};

// export const verifyEmailToken = async (req, res) => {
//   const { email, token } = req.query;
//   const decodedEmail = decodeURIComponent(email);
//   try {
//     const [tokenRecord] = await db
//       .select()
//       .from(verifyEmailTable)
//       .where(eq(verifyEmailTable.token, token))
//       .where(eq(verifyEmailTable.userId, req.user.id));

//     if (!tokenRecord || tokenRecord.expiresAt < new Date()) {
//       req.flash("error", "Invalid or expired verification token");
//       return res.redirect("/api/v1/auth/verify-email");
//     }

//     await db.update(usersTable).set({ isValidEmail: true }).where(eq(usersTable.id, req.user.id));
//     await db.delete(verifyEmailTable).where(eq(verifyEmailTable.token, token));

//     return res.redirect("/api/v1/auth/profile");
//   } catch (error) {
//     console.error("Error verifying email token:", error);
//     req.flash("error", "Failed to verify email. Please try again.");
//     return res.redirect("/api/v1/auth/verify-email");
//   }
// };
