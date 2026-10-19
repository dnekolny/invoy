"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { emailChannel, emailLog, invoice } from "@/db/schema";
import { requireCompany } from "@/lib/company";
import { encrypt } from "@/lib/crypto";
import { sendWithChannel, transportFor } from "@/lib/invoice-mail";
import { getInvoiceDocument, getInvoiceWithLines } from "@/lib/invoices";
import { htmlToPdf } from "@/lib/pdf";
import { invoiceFileName, renderInvoiceHtml } from "@/templates";
import { formToObject, type ActionResult } from "@/lib/validation";

const channelSchema = z.object({
  preset: z.enum(["gmail", "seznam", "custom"]),
  fromName: z.string().trim().min(1),
  fromEmail: z.string().trim().email(),
  host: z.string().trim().min(1),
  port: z.coerce.number().int().min(1).max(65535),
  secure: z.preprocess((v) => v === "true" || v === "on", z.boolean()),
  username: z.string().trim().min(1),
  password: z.string().optional(),
  replyTo: z.string().trim().email().or(z.literal("")).transform((v) => v || null),
  bcc: z.string().trim().email().or(z.literal("")).transform((v) => v || null),
  subjectTemplate: z.string().trim().transform((v) => v || null),
  bodyTemplate: z.string().trim().transform((v) => v || null),
});

export async function saveEmailChannelAction(fd: FormData): Promise<ActionResult> {
  const active = await requireCompany();
  const parsed = channelSchema.safeParse(formToObject(fd));
  if (!parsed.success) return { ok: false, error: "invalid" };
  const { password, ...data } = parsed.data;
  const [existing] = await db.select().from(emailChannel).where(eq(emailChannel.companyId, active.id)).limit(1);
  if (!existing && !password) return { ok: false, error: "password" };
  const passwordEnc = password ? encrypt(password) : existing!.passwordEnc;
  if (existing) {
    await db.update(emailChannel).set({ ...data, passwordEnc, verifiedAt: null, updatedAt: new Date() }).where(eq(emailChannel.id, existing.id));
  } else {
    await db.insert(emailChannel).values({ ...data, passwordEnc, companyId: active.id });
  }
  revalidatePath("/settings/email");
  return { ok: true };
}

export async function testEmailChannelAction(): Promise<ActionResult> {
  const active = await requireCompany();
  const [ch] = await db.select().from(emailChannel).where(eq(emailChannel.companyId, active.id)).limit(1);
  if (!ch) return { ok: false, error: "nochannel" };
  try {
    await transportFor(ch).verify();
    await sendWithChannel(ch, { to: ch.fromEmail, subject: "Invoy – test", text: "Odesílání e-mailů z Invoy funguje.\n\nSending e-mails from Invoy works." });
    await db.update(emailChannel).set({ verifiedAt: new Date() }).where(eq(emailChannel.id, ch.id));
    revalidatePath("/settings/email");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message.slice(0, 200) };
  }
}

export async function deleteEmailChannelAction(): Promise<ActionResult> {
  const active = await requireCompany();
  await db.delete(emailChannel).where(eq(emailChannel.companyId, active.id));
  revalidatePath("/settings/email");
  return { ok: true };
}

const sendSchema = z.object({
  to: z.string().trim().email(),
  subject: z.string().trim().min(1),
  body: z.string().trim().min(1),
  copyToMe: z.boolean().optional(),
});

export async function sendInvoiceAction(id: string, raw: unknown): Promise<ActionResult> {
  const active = await requireCompany();
  const parsed = sendSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const [ch] = await db.select().from(emailChannel).where(eq(emailChannel.companyId, active.id)).limit(1);
  if (!ch) return { ok: false, error: "nochannel" };
  const inv = await getInvoiceWithLines(active.id, id);
  if (!inv || inv.status === "draft") return { ok: false, error: "state" };
  const doc = await getInvoiceDocument(inv);
  try {
    const pdf = await htmlToPdf(await renderInvoiceHtml(doc));
    await sendWithChannel(ch, {
      to: parsed.data.to,
      subject: parsed.data.subject,
      text: parsed.data.body,
      bcc: parsed.data.copyToMe ? ch.fromEmail : undefined,
      attachments: [{ filename: invoiceFileName(doc), content: Buffer.from(pdf), contentType: "application/pdf" }],
    });
    await db.insert(emailLog).values({ invoiceId: id, to: parsed.data.to, subject: parsed.data.subject, status: "sent" });
    await db
      .update(invoice)
      .set({ sentAt: new Date(), status: inv.status === "issued" ? "sent" : inv.status, updatedAt: new Date() })
      .where(eq(invoice.id, id));
  } catch (e) {
    const msg = (e as Error).message.slice(0, 300);
    await db.insert(emailLog).values({ invoiceId: id, to: parsed.data.to, subject: parsed.data.subject, status: "error", error: msg });
    revalidatePath(`/invoices/${id}`);
    return { ok: false, error: msg };
  }
  revalidatePath(`/invoices/${id}`);
  revalidatePath("/invoices");
  return { ok: true };
}
