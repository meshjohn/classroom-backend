import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { sendEmail } from "./email.js";

import { db } from "../db/index.js"; // your drizzle instance
import * as schema from "../db/schema/auth.js";

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET!,
  trustedOrigins: [process.env.FRONTEND_URL?.replace(/\/$/, "")!],
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 6,
    async sendResetPassword({ user, url }, request) {
      console.log("Reset link for:", user.email, "is:", url);
      await sendEmail({
        to: user.email,
        subject: "Reset your password",
        text: `Click the link to reset your password: ${url}`,
        html: `<a href="${url}">Click here to reset your password</a>`,
      });
    },
  },
  map: {
    emailVerified: "email_verified",
    createdAt: "created_at",
    updatedAt: "updated_at",
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    },
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: true,
        defaultValue: "student",
        input: true, // Allow role to be set during registration
      },
      imageCldPubId: {
        type: "string",
        required: false,
        input: true, // Allow imageCldPubId to be set during registration
        fieldName: "imageCldPubId",
      },
      department: {
        type: "string",
        required: false,
        input: true,
      },
    },
  },
});
