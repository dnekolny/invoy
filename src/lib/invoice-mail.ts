import nodemailer from "nodemailer";
import type { EmailChannel } from "@/db/schema";
import { decrypt } from "@/lib/crypto";

export { defaultTemplates, fillTemplate, type MailContext } from "@/lib/mail-templates";

export function transportFor(ch: EmailChannel) {
  return nodemailer.createTransport({
    host: ch.host,
    port: ch.port,
    secure: ch.secure,
    auth: { user: ch.username, pass: decrypt(ch.passwordEnc) },
  });
}

export async function sendWithChannel(ch: EmailChannel, msg: { to: string; subject: string; text: string; bcc?: string; attachments?: { filename: string; content: Buffer; contentType: string }[] }) {
  const transport = transportFor(ch);
  const bcc = [ch.bcc, msg.bcc].filter((v): v is string => Boolean(v));
  return transport.sendMail({
    from: { name: ch.fromName, address: ch.fromEmail },
    replyTo: ch.replyTo ?? undefined,
    ...msg,
    bcc: bcc.length ? bcc : undefined,
  });
}
