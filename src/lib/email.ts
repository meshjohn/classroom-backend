import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const port = parseInt(process.env.SMTP_PORT || "465");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: port,
  secure: port === 465, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const sendEmail = async ({
  to,
  subject,
  text,
  html,
}: {
  to: string;
  subject: string;
  text: string;
  html?: string;
}) => {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn(
      "SMTP credentials not found. Email not sent. Please set SMTP_USER and SMTP_PASS in .env",
    );
    console.log(`[Mock Email] To: ${to}, Subject: ${subject}, Body: ${text}`);
    return;
  }

  try {
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || '"Classroom App" <no-reply@classroom.com>',
      to,
      subject,
      text,
      html,
    });

    console.log("Message sent: %s", info.messageId);
  } catch (error) {
    console.error("Error sending email:", error);
    // Don't throw to prevent crashing auth flow, but log error
  }
};
