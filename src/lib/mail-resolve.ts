import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { customer, mailTemplate, type EmailChannel, type Invoice } from "@/db/schema";
import { defaultTemplates } from "@/lib/mail-templates";

export type MailTemplateOption = { id: string; name: string; subject: string; body: string };

export function listMailTemplates(companyId: string): Promise<MailTemplateOption[]> {
  return db.select({ id: mailTemplate.id, name: mailTemplate.name, subject: mailTemplate.subject, body: mailTemplate.body }).from(mailTemplate).where(eq(mailTemplate.companyId, companyId)).orderBy(asc(mailTemplate.name));
}

export function mainMailTemplate(ch: Pick<EmailChannel, "subjectTemplate" | "bodyTemplate"> | null, lang: string) {
  const d = defaultTemplates[lang === "en" ? "en" : "cs"];
  return { subject: ch?.subjectTemplate ?? d.subject, body: ch?.bodyTemplate ?? d.body };
}

export async function customerMailTemplateId(customerId: string | null) {
  if (!customerId) return null;
  const [c] = await db.select({ id: customer.mailTemplateId }).from(customer).where(eq(customer.id, customerId)).limit(1);
  return c?.id ?? null;
}

export async function mailTemplateForInvoice(ch: EmailChannel, inv: Invoice) {
  const id = await customerMailTemplateId(inv.customerId);
  if (id) {
    const [t] = await db.select({ subject: mailTemplate.subject, body: mailTemplate.body }).from(mailTemplate).where(eq(mailTemplate.id, id)).limit(1);
    if (t) return t;
  }
  return mainMailTemplate(ch, inv.language);
}
