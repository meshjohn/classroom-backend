import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

// Vercel works best with Port 465 + Secure: true
const port = 465; 

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: port,
  secure: true, // true for 465
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  // CRITICAL FOR CLOUD HOSTS:
  family: 4, // Forces IPv4 to avoid Gmail's IPv6 filtering
  connectionTimeout: 10000, // 10 seconds
  greetingTimeout: 10000,
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
    console.warn("SMTP credentials missing.");
    return;
  }

  try {
    // IMPORTANT: On Vercel, you MUST 'await' the result 
    // before the function finishes.
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || `"Classroom App" <${process.env.SMTP_USER}>`,
      to,
      subject,
      text,
      html,
    });

    console.log("Message sent: %s", info.messageId);
    return info; 
  } catch (error) {
    console.error("Error sending email:", error);
    throw error; // Throwing here lets Vercel know the function failed
  }
};