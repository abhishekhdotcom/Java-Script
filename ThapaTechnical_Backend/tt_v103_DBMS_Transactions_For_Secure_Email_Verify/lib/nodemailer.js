import nodemailer from "nodemailer";

// Create a test account automatically OR use your own SMTP credentials
const testAccount = await nodemailer.createTestAccount();

// Create a test account or replace with real credentials.
const transporter = nodemailer.createTransport({
  host: "smtp.ethereal.email",
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: "graham.simonis17@ethereal.email",
    pass: "DhsAyR19vGygDTFJ4K",
  },
});

// Send Email to user for Email Address Verification
export const sendEmail = async ({ to, subject, html }) => {
  const info = await transporter.sendMail({
    from: `"TechnologyFireX" <${testAccount.user}>`,
    to,
    subject,
    html,
  });
  console.log("Message sent:", info.messageId);
  console.log("Preview URL:", nodemailer.getTestMessageUrl(info));
};
