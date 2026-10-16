import nodemailer from "nodemailer";

const port = Number(process.env.SMTP_PORT ?? 587);

export const mailer = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port,
  secure: port === 465,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});

export function sendSystemMail(opts: { to: string; subject: string; text: string; html?: string }) {
  return mailer.sendMail({ from: process.env.SMTP_FROM, ...opts });
}
