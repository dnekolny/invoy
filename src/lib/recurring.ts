import { randomBytes } from "node:crypto";
import { and, eq, lte } from "drizzle-orm";
import Decimal from "decimal.js";
import { db } from "@/db";
import { company, customer, emailChannel, invoice, invoiceLine, recurringTemplate, type RecurringTemplate } from "@/db/schema";
import { cnbRate } from "@/lib/cnb";
import { addDays, advance, todayIso } from "@/lib/dates";
import { nextInvoiceNumber } from "@/lib/invoice-number";
import { defaultTemplates, fillTemplate, sendWithChannel } from "@/lib/invoice-mail";
import { companyBankAccounts, getInvoiceDocument } from "@/lib/invoices";
import { computeLine, computeTotals, toDb } from "@/lib/money";
import { htmlToPdf } from "@/lib/pdf";
import { invoiceFileName, renderInvoiceHtml } from "@/templates";

export async function runRecurring(now = todayIso()) {
  const due = await db
    .select()
    .from(recurringTemplate)
    .where(and(eq(recurringTemplate.active, true), lte(recurringTemplate.nextDate, now)));
  const results: { id: string; invoiceId?: string; error?: string }[] = [];
  for (const tpl of due) {
    try {
      const invoiceId = await generateFromTemplate(tpl, now);
      results.push({ id: tpl.id, invoiceId });
    } catch (e) {
      results.push({ id: tpl.id, error: (e as Error).message });
    }
  }
  return results;
}

export async function generateFromTemplate(tpl: RecurringTemplate, issueDate: string) {
  const [comp] = await db.select().from(company).where(eq(company.id, tpl.companyId)).limit(1);
  const [cust] = await db.select().from(customer).where(eq(customer.id, tpl.customerId)).limit(1);
  if (!comp || !cust) throw new Error("missing company or customer");
  const banks = await companyBankAccounts(comp.id);
  const bank = banks.find((b) => b.currency === tpl.currency && b.isDefault) ?? banks.find((b) => b.currency === tpl.currency) ?? banks[0];
  const totals = computeTotals(tpl.lines, comp.vatPayer);
  const issue = tpl.autoIssue;
  const number = issue ? await nextInvoiceNumber(comp.id, tpl.type, tpl.type === "proforma" ? comp.proformaPattern : comp.invoicePattern, issueDate) : null;
  const rate = issue && tpl.currency !== "CZK" ? await cnbRate(tpl.currency, new Date(issueDate)) : null;
  const [row] = await db
    .insert(invoice)
    .values({
      companyId: comp.id,
      customerId: cust.id,
      type: tpl.type,
      status: issue ? "issued" : "draft",
      number,
      variableSymbol: number ? number.replace(/\D/g, "").slice(0, 10) || null : null,
      issueDate,
      taxDate: comp.vatPayer ? issueDate : null,
      dueDate: addDays(issueDate, tpl.dueDays),
      currency: tpl.currency,
      exchangeRate: rate,
      language: cust.language,
      vatPayer: comp.vatPayer,
      bankAccountId: bank?.id ?? null,
      customerName: cust.name,
      customerIco: cust.ico,
      customerDic: cust.dic,
      customerStreet: cust.street,
      customerCity: cust.city,
      customerZip: cust.zip,
      customerCountry: cust.country,
      customerEmail: cust.email,
      subtotal: toDb(totals.subtotal),
      vatTotal: toDb(totals.vatTotal),
      total: toDb(totals.total),
      note: tpl.note,
      publicToken: randomBytes(24).toString("base64url"),
      recurringId: tpl.id,
    })
    .returning({ id: invoice.id });
  await db.insert(invoiceLine).values(
    tpl.lines.map((l, i) => {
      const rateV = comp.vatPayer ? l.vatRate : 0;
      const { net, vat } = computeLine({ ...l, vatRate: rateV });
      return { invoiceId: row.id, position: i, name: l.name, quantity: new Decimal(l.quantity).toFixed(3), unit: l.unit, unitPrice: toDb(l.unitPrice), vatRate: rateV, net: toDb(net), vat: toDb(vat) };
    })
  );
  await db
    .update(recurringTemplate)
    .set({ nextDate: advance(tpl.nextDate, tpl.interval), lastRunAt: new Date() })
    .where(eq(recurringTemplate.id, tpl.id));

  if (issue && tpl.autoSend && cust.email) {
    const [ch] = await db.select().from(emailChannel).where(eq(emailChannel.companyId, comp.id)).limit(1);
    if (ch) {
      const [inv] = await db.select().from(invoice).where(eq(invoice.id, row.id)).limit(1);
      const doc = await getInvoiceDocument(inv);
      const lang = cust.language === "en" ? "en" : "cs";
      const loc = lang === "cs" ? "cs-CZ" : "en-GB";
      const ctx = {
        number: inv.number ?? "",
        total: new Intl.NumberFormat(loc, { style: "currency", currency: inv.currency }).format(Number(inv.total)),
        dueDate: new Intl.DateTimeFormat(loc, { dateStyle: "medium" }).format(new Date(inv.dueDate + "T00:00:00")),
        company: comp.name,
        customer: cust.name,
        link: `${process.env.BETTER_AUTH_URL}/i/${inv.publicToken}`,
        lang,
        type: inv.type,
      };
      const subject = fillTemplate(ch.subjectTemplate ?? defaultTemplates[lang].subject, ctx);
      const body = fillTemplate(ch.bodyTemplate ?? defaultTemplates[lang].body, ctx);
      const pdf = await htmlToPdf(await renderInvoiceHtml(doc));
      await sendWithChannel(ch, { to: cust.email, subject, text: body, attachments: [{ filename: invoiceFileName(doc), content: Buffer.from(pdf), contentType: "application/pdf" }] });
      const { emailLog } = await import("@/db/schema");
      await db.insert(emailLog).values({ invoiceId: inv.id, to: cust.email, subject, status: "sent" });
      await db.update(invoice).set({ status: "sent", sentAt: new Date() }).where(eq(invoice.id, inv.id));
    }
  }
  return row.id;
}
