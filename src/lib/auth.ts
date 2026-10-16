import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { emailOTP } from "better-auth/plugins";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { sendSystemMail } from "@/lib/mail";

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg", schema, transaction: false }),
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },
  plugins: [
    emailOTP({
      otpLength: 6,
      expiresIn: 600,
      async sendVerificationOTP({ email, otp }) {
        await sendSystemMail({
          to: email,
          subject: `${otp} – přihlašovací kód do Invoy`,
          text: `Váš přihlašovací kód je ${otp}. Platí 10 minut.\n\nYour sign-in code is ${otp}. It expires in 10 minutes.`,
        });
      },
    }),
    nextCookies(),
  ],
});

export type Session = typeof auth.$Infer.Session;
