import { and, asc, desc, eq, ilike, inArray, or, sql, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { bankAccount, company, customer, emailLog, invoice, invoiceLine, payment, type Invoice, type InvoiceStatus, type InvoiceType } from "@/db/schema";
import { todayIso } from "@/lib/dates";

export type InvoiceFilter = "all" | "draft" | "unpaid" | "overdue" | "paid";

export async function listInvoices(companyId: string, opts: { filter?: InvoiceFilter; type?: InvoiceType | "all"; q?: string; year?: number }) {
  const conds: SQL[] = [eq(invoice.companyId, companyId)];
  const today = todayIso();
  switch (opts.filter) {
    case "draft":
      conds.push(eq(invoice.status, "draft"));
      break;
    case "unpaid":
      conds.push(inArray(invoice.status, ["issued", "sent"]));
      break;
    case "overdue":
      conds.push(inArray(invoice.status, ["issued", "sent"]), sql`${invoice.dueDate} < ${today}`);
      break;
    case "paid":
      conds.push(eq(invoice.status, "paid"));
      break;
  }
  if (opts.type && opts.type !== "all") conds.push(eq(invoice.type, opts.type));
  if (opts.year) conds.push(sql`extract(year from ${invoice.issueDate}) = ${opts.year}`);
  if (opts.q) {
    const like = `%${opts.q}%`;
    conds.push(or(ilike(invoice.number, like), ilike(invoice.customerName, like), ilike(invoice.variableSymbol, like))!);
  }
  return db
    .select()
    .from(invoice)
    .where(and(...conds))
    .orderBy(desc(invoice.issueDate), desc(invoice.createdAt));
}

export async function getInvoiceWithLines(companyId: string, id: string) {
  const [inv] = await db.select().from(invoice).where(and(eq(invoice.id, id), eq(invoice.companyId, companyId))).limit(1);
  if (!inv) return null;
  const lines = await db.select().from(invoiceLine).where(eq(invoiceLine.invoiceId, id)).orderBy(asc(invoiceLine.position));
  return { ...inv, lines };
}

export type InvoiceWithLines = NonNullable<Awaited<ReturnType<typeof getInvoiceWithLines>>>;

export async function getInvoiceDocument(inv: Invoice) {
  const [comp] = await db.select().from(company).where(eq(company.id, inv.companyId)).limit(1);
  const lines = await db.select().from(invoiceLine).where(eq(invoiceLine.invoiceId, inv.id)).orderBy(asc(invoiceLine.position));
  const bank = inv.bankAccountId
    ? (await db.select().from(bankAccount).where(eq(bankAccount.id, inv.bankAccountId)).limit(1))[0] ?? null
    : null;
  return { company: comp, invoice: inv, lines, bank };
}

export type InvoiceDocument = Awaited<ReturnType<typeof getInvoiceDocument>>;

export async function getInvoiceByToken(token: string) {
  const [inv] = await db.select().from(invoice).where(eq(invoice.publicToken, token)).limit(1);
  return inv ?? null;
}

export async function getInvoiceActivity(invoiceId: string) {
  const [payments, mails] = await Promise.all([
    db.select().from(payment).where(eq(payment.invoiceId, invoiceId)).orderBy(desc(payment.date)),
    db.select().from(emailLog).where(eq(emailLog.invoiceId, invoiceId)).orderBy(desc(emailLog.sentAt)),
  ]);
  return { payments, mails };
}

export async function companyCustomers(companyId: string) {
  return db.select().from(customer).where(eq(customer.companyId, companyId)).orderBy(asc(customer.name));
}

export async function companyBankAccounts(companyId: string) {
  return db.select().from(bankAccount).where(eq(bankAccount.companyId, companyId)).orderBy(desc(bankAccount.isDefault), asc(bankAccount.label));
}

export function effectiveStatus(inv: { status: InvoiceStatus; dueDate: string }): InvoiceStatus | "overdue" {
  if ((inv.status === "issued" || inv.status === "sent") && inv.dueDate < todayIso()) return "overdue";
  return inv.status;
}
