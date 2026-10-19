import { and, eq, inArray, isNotNull, lt, sql } from "drizzle-orm";
import { db } from "@/db";
import { company, emailChannel, emailLog, invoice, type EmailChannel, type Invoice } from "@/db/schema";
import { daysOverdue, todayIso } from "@/lib/dates";
import { sendWithChannel } from "@/lib/invoice-mail";
import { getInvoiceDocument } from "@/lib/invoices";
import { mailContext } from "@/lib/mail-context";
import { defaultReminderTemplates, fillTemplate, parseReminderDays } from "@/lib/mail-templates";
import { htmlToPdf } from "@/lib/pdf";
import { invoiceFileName, renderInvoiceHtml } from "@/templates";

export async function sendReminder(inv: Invoice, ch: EmailChannel, companyName: string, override?: { to: string; subject: string; body: string }) {
  const ctx = mailContext(inv, companyName);
  const lang = ctx.lang === "en" ? "en" : "cs";
  const to = override?.to ?? inv.customerEmail;
  if (!to) throw new Error("no recipient");
  const subject = override?.subject ?? fillTemplate(ch.reminderSubjectTemplate ?? defaultReminderTemplates[lang].subject, ctx);
  const body = override?.body ?? fillTemplate(ch.reminderBodyTemplate ?? defaultReminderTemplates[lang].body, ctx);
  try {
    const doc = await getInvoiceDocument(inv);
    const pdf = await htmlToPdf(await renderInvoiceHtml(doc));
    await sendWithChannel(ch, { to, subject, text: body, attachments: [{ filename: invoiceFileName(doc), content: Buffer.from(pdf), contentType: "application/pdf" }] });
    await db.insert(emailLog).values({ invoiceId: inv.id, to, subject, kind: "reminder", status: "sent" });
    await db
      .update(invoice)
      .set({ reminderCount: sql`${invoice.reminderCount} + 1`, lastReminderAt: new Date(), updatedAt: new Date() })
      .where(eq(invoice.id, inv.id));
  } catch (e) {
    const msg = (e as Error).message.slice(0, 300);
    await db.insert(emailLog).values({ invoiceId: inv.id, to, subject, kind: "reminder", status: "error", error: msg });
    throw e;
  }
}

export async function runReminders(now = todayIso()) {
  const channels = await db
    .select({ ch: emailChannel, companyName: company.name })
    .from(emailChannel)
    .innerJoin(company, eq(company.id, emailChannel.companyId))
    .where(eq(emailChannel.remindersEnabled, true));
  const results: { invoiceId: string; error?: string }[] = [];
  for (const { ch, companyName } of channels) {
    const days = parseReminderDays(ch.reminderDays);
    if (!days.length) continue;
    const due = await db
      .select()
      .from(invoice)
      .where(and(eq(invoice.companyId, ch.companyId), eq(invoice.type, "invoice"), inArray(invoice.status, ["issued", "sent"]), lt(invoice.dueDate, now), isNotNull(invoice.customerEmail), lt(invoice.reminderCount, days.length)));
    for (const inv of due) {
      const overdue = daysOverdue(inv.dueDate);
      if (overdue < days[inv.reminderCount]) continue;
      if (inv.lastReminderAt && inv.lastReminderAt.toISOString().slice(0, 10) === now) continue;
      try {
        await sendReminder(inv, ch, companyName);
        results.push({ invoiceId: inv.id });
      } catch (e) {
        results.push({ invoiceId: inv.id, error: (e as Error).message });
      }
    }
  }
  return results;
}
