import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_EMAIL_API_KEY);

// Send Email to user for Email Address Verification using Resend
export const sendEmail = async ({ to, subject, html }) => {
  try {
    const { data, error } = await resend.emails.send({
      from: `"TechnologyFireX" <website@resend.dev>`,
      to: [to],
      subject,
      html,
    });

    if (error) {
      return console.error({ error });
    } else {
      console.log(data);
    }
  } catch (error) {
    console.error(error);
  }
};
