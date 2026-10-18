"use server";

import { randomBytes } from "node:crypto";
import { and, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import Decimal from "decimal.js";
import { db } from "@/db";
import { customer, invoice, invoiceLine, payment, type InvoiceStatus } from "@/db/schema";
import { cnbRate } from "@/lib/cnb";
import { requireCompany } from "@/lib/company";
import { todayIso } from "@/lib/dates";
import { nextInvoiceNumber } from "@/lib/invoice-number";
import { invoiceInputSchema, paymentInputSchema, type InvoiceInput, type PaymentInput } from "@/lib/invoice-schema";
import { getInvoiceWithLines } from "@/lib/invoices";
import { computeLine, computeTotals, toDb } from "@/lib/money";
import type { ActionResult } from "@/lib/validation";

type SaveResult = { ok: true; id: string } | { ok: false; error: string };

async function customerSnapshot(companyId: string, customerId: string | null) {
  if (!customerId) return null;
  const [c] = await db.select().from(customer).where(and(eq(customer.id, customerId), eq(customer.companyId, companyId))).limit(1);
  if (!c) return null;
  return {
    customerId: c.id,
    customerName: c.name,
    customerIco: c.ico,
    customerDic: c.dic,
    customerStreet: c.street,
    customerCity: c.city,
    customerZip: c.zip,
    customerCountry: c.country,
    customerEmail: c.email,
  };
}

async function writeLines(invoiceId: string, lines: InvoiceInput["lines"], vatPayer: boolean) {
  await db.delete(invoiceLine).where(eq(invoiceLine.invoiceId, invoiceId));
  await db.insert(invoiceLine).values(
    lines.map((l, i) => {
      const rate = vatPayer ? l.vatRate : 0;
      const { net, vat } = computeLine({ ...l, vatRate: rate });
      return {
        invoiceId,
        position: i,
        name: l.name,
        quantity: new Decimal(l.quantity).toFixed(3),
        unit: l.unit,
        unitPrice: toDb(l.unitPrice),
        vatRate: rate,
        net: toDb(net),
        vat: toDb(vat),
      };
    })
  );
}

export async function saveInvoiceAction(id: string | null, raw: unknown): Promise<SaveResult> {
  const active = await requireCompany();
  const parsed = invoiceInputSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const input = parsed.data;
  const snap = await customerSnapshot(active.id, input.customerId);
  const totals = computeTotals(input.lines, active.vatPayer);
  const base = {
    type: input.type,
    issueDate: input.issueDate,
    taxDate: active.vatPayer ? (input.taxDate ?? input.issueDate) : null,
    dueDate: input.dueDate,
    currency: input.currency,
    language: input.language,
    bankAccountId: input.bankAccountId,
    note: input.note,
    vatPayer: active.vatPayer,
    subtotal: toDb(totals.subtotal),
    vatTotal: toDb(totals.vatTotal),
    total: toDb(totals.total),
    ...(snap ?? { customerId: null, customerName: "" }),
    updatedAt: new Date(),
  };

  let invoiceId = id;
  if (id) {
    const existing = await getInvoiceWithLines(active.id, id);
    if (!existing) return { ok: false, error: "notfound" };
    if (existing.status === "paid" || existing.status === "cancelled") return { ok: false, error: "locked" };
    const { type: _type, ...rest } = base;
    void _type;
    await db.update(invoice).set(existing.status === "draft" ? base : rest).where(eq(invoice.id, id));
  } else {
    const [row] = await db
      .insert(invoice)
      .values({ ...base, companyId: active.id, publicToken: randomBytes(24).toString("base64url") })
      .returning({ id: invoice.id });
    invoiceId = row.id;
  }
  await writeLines(invoiceId!, input.lines, active.vatPayer);
  revalidatePath("/invoices");
  return { ok: true, id: invoiceId! };
}

export async function issueInvoiceAction(id: string): Promise<ActionResult> {
  const active = await requireCompany();
  const inv = await getInvoiceWithLines(active.id, id);
  if (!inv) return { ok: false, error: "notfound" };
  if (inv.status !== "draft") return { ok: false, error: "state" };
  if (!inv.customerId) return { ok: false, error: "customer" };
  if (inv.lines.length === 0) return { ok: false, error: "lines" };
  const pattern = inv.type === "proforma" ? active.proformaPattern : active.invoicePattern;
  const number = await nextInvoiceNumber(active.id, inv.type, pattern, inv.issueDate);
  const rate = inv.currency !== "CZK" ? await cnbRate(inv.currency, new Date(inv.taxDate ?? inv.issueDate)) : null;
  await db
    .update(invoice)
    .set({ number, variableSymbol: number.replace(/\D/g, "").slice(0, 10) || null, status: "issued", exchangeRate: rate, updatedAt: new Date() })
    .where(eq(invoice.id, id));
  revalidatePath("/invoices");
  revalidatePath(`/invoices/${id}`);
  return { ok: true };
}

export async function setInvoiceStatusAction(id: string, status: InvoiceStatus): Promise<ActionResult> {
  const active = await requireCompany();
  const inv = await getInvoiceWithLines(active.id, id);
  if (!inv) return { ok: false, error: "notfound" };
  const allowed: Record<string, InvoiceStatus[]> = {
    issued: ["cancelled", "sent"],
    sent: ["cancelled", "issued"],
    cancelled: ["issued"],
    paid: ["issued"],
  };
  if (!allowed[inv.status]?.includes(status)) return { ok: false, error: "state" };
  const patch: Partial<typeof invoice.$inferInsert> = { status, updatedAt: new Date() };
  if (inv.status === "paid" && status === "issued") {
    await db.delete(payment).where(eq(payment.invoiceId, id));
    patch.paidAmount = "0";
    patch.paidAt = null;
  }
  await db.update(invoice).set(patch).where(eq(invoice.id, id));
  revalidatePath("/invoices");
  revalidatePath(`/invoices/${id}`);
  return { ok: true };
}

export async function deleteInvoiceAction(id: string): Promise<ActionResult> {
  const active = await requireCompany();
  const inv = await getInvoiceWithLines(active.id, id);
  if (!inv) return { ok: false, error: "notfound" };
  if (inv.status !== "draft") return { ok: false, error: "state" };
  await db.delete(invoice).where(eq(invoice.id, id));
  revalidatePath("/invoices");
  redirect("/invoices");
}

async function cloneInvoice(sourceId: string, overrides: Partial<typeof invoice.$inferInsert>) {
  const active = await requireCompany();
  const src = await getInvoiceWithLines(active.id, sourceId);
  if (!src) return null;
  const { id: _id, lines, number: _n, variableSymbol: _vs, status: _s, publicToken: _t, createdAt: _c, updatedAt: _u, sentAt: _sa, viewedAt: _va, paidAmount: _pa, paidAt: _pd, exchangeRate: _er, proformaId: _pf, recurringId: _ri, ...rest } = src;
  void [_id, _n, _vs, _s, _t, _c, _u, _sa, _va, _pa, _pd, _er, _pf, _ri];
  const today = todayIso();
  const dueDays = Math.max(0, Math.round((new Date(src.dueDate).getTime() - new Date(src.issueDate).getTime()) / 86400000));
  const [row] = await db
    .insert(invoice)
    .values({
      ...rest,
      issueDate: today,
      taxDate: src.taxDate ? today : null,
      dueDate: new Date(new Date(today).getTime() + dueDays * 86400000).toISOString().slice(0, 10),
      status: "draft",
      publicToken: randomBytes(24).toString("base64url"),
      ...overrides,
    })
    .returning({ id: invoice.id });
  if (lines.length) {
    await db.insert(invoiceLine).values(
      lines.map(({ id: _lid, invoiceId: _iid, ...l }) => {
        void [_lid, _iid];
        return { ...l, invoiceId: row.id };
      })
    );
  }
  return row.id;
}

export async function duplicateInvoiceAction(id: string): Promise<SaveResult> {
  const newId = await cloneInvoice(id, {});
  if (!newId) return { ok: false, error: "notfound" };
  revalidatePath("/invoices");
  return { ok: true, id: newId };
}

export async function invoiceFromProformaAction(id: string): Promise<SaveResult> {
  const active = await requireCompany();
  const src = await getInvoiceWithLines(active.id, id);
  if (!src || src.type !== "proforma") return { ok: false, error: "notfound" };
  const newId = await cloneInvoice(id, { type: "invoice", proformaId: id, note: src.note });
  if (!newId) return { ok: false, error: "notfound" };
  revalidatePath("/invoices");
  return { ok: true, id: newId };
}

export async function addPaymentAction(id: string, raw: PaymentInput): Promise<ActionResult> {
  const active = await requireCompany();
  const parsed = paymentInputSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const inv = await getInvoiceWithLines(active.id, id);
  if (!inv || inv.status === "draft" || inv.status === "cancelled") return { ok: false, error: "state" };
  await db.insert(payment).values({ invoiceId: id, date: parsed.data.date, amount: toDb(parsed.data.amount), note: parsed.data.note });
  await recomputePaid(id);
  revalidatePath(`/invoices/${id}`);
  revalidatePath("/invoices");
  return { ok: true };
}

export async function deletePaymentAction(paymentId: string): Promise<ActionResult> {
  const active = await requireCompany();
  const [p] = await db.select({ invoiceId: payment.invoiceId }).from(payment).where(eq(payment.id, paymentId)).limit(1);
  if (!p) return { ok: false, error: "notfound" };
  const inv = await getInvoiceWithLines(active.id, p.invoiceId);
  if (!inv) return { ok: false, error: "notfound" };
  await db.delete(payment).where(eq(payment.id, paymentId));
  await recomputePaid(p.invoiceId);
  revalidatePath(`/invoices/${p.invoiceId}`);
  revalidatePath("/invoices");
  return { ok: true };
}

async function recomputePaid(invoiceId: string) {
  const [agg] = await db
    .select({ sum: sql<string>`coalesce(sum(${payment.amount}), 0)`, last: sql<string | null>`max(${payment.date})` })
    .from(payment)
    .where(eq(payment.invoiceId, invoiceId));
  const [inv] = await db.select({ total: invoice.total, status: invoice.status, sentAt: invoice.sentAt }).from(invoice).where(eq(invoice.id, invoiceId));
  const paid = new Decimal(agg.sum);
  const fullyPaid = paid.gte(inv.total) && paid.gt(0);
  const status: InvoiceStatus = fullyPaid ? "paid" : inv.sentAt ? "sent" : "issued";
  await db
    .update(invoice)
    .set({ paidAmount: toDb(paid), paidAt: fullyPaid ? agg.last : null, status, updatedAt: new Date() })
    .where(eq(invoice.id, invoiceId));
}
