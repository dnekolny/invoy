import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { bankAccount, customer, type Invoice, type InvoiceLine } from "@/db/schema";
import { requireCompany } from "@/lib/company";
import { companyCounters } from "@/lib/invoice-number";
import { peekNumber } from "@/lib/invoice-number-peek";
import { invoiceInputSchema, lineInputSchema } from "@/lib/invoice-schema";
import { computeLine, computeTotals, toDb } from "@/lib/money";
import { renderInvoiceHtml } from "@/templates";

const schema = invoiceInputSchema.extend({ lines: z.array(lineInputSchema), number: z.string().nullable().optional() });

export async function POST(req: Request) {
  const active = await requireCompany();
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return new Response("invalid", { status: 400 });
  const input = parsed.data;
  const [cust, bank, counters] = await Promise.all([
    input.customerId ? db.select().from(customer).where(and(eq(customer.id, input.customerId), eq(customer.companyId, active.id))).limit(1).then((r) => r[0] ?? null) : null,
    input.bankAccountId ? db.select().from(bankAccount).where(and(eq(bankAccount.id, input.bankAccountId), eq(bankAccount.companyId, active.id))).limit(1).then((r) => r[0] ?? null) : null,
    input.number ? Promise.resolve({}) : companyCounters(active.id),
  ]);
  const lines = input.lines.filter((l) => l.name.trim());
  const totals = computeTotals(lines, active.vatPayer);
  const now = new Date();
  const number = input.number ?? peekNumber(counters, input.type, input.type === "proforma" ? active.proformaPattern : active.invoicePattern, input.issueDate);
  const inv: Invoice = {
    id: "preview",
    companyId: active.id,
    customerId: cust?.id ?? null,
    type: input.type,
    status: "issued",
    number,
    variableSymbol: number.replace(/\D/g, "").slice(0, 10) || null,
    issueDate: input.issueDate,
    taxDate: active.vatPayer ? (input.taxDate ?? input.issueDate) : null,
    dueDate: input.dueDate,
    currency: input.currency,
    exchangeRate: null,
    language: input.language,
    vatPayer: active.vatPayer,
    bankAccountId: bank?.id ?? null,
    customerName: cust?.name ?? "",
    customerIco: cust?.ico ?? null,
    customerDic: cust?.dic ?? null,
    customerStreet: cust?.street ?? null,
    customerCity: cust?.city ?? null,
    customerZip: cust?.zip ?? null,
    customerCountry: cust?.country ?? "CZ",
    customerEmail: cust?.email ?? null,
    subtotal: toDb(totals.subtotal),
    vatTotal: toDb(totals.vatTotal),
    total: toDb(totals.total),
    paidAmount: "0",
    paidAt: null,
    intro: input.intro,
    note: input.note,
    reminderCount: 0,
    lastReminderAt: null,
    publicToken: "preview",
    proformaId: null,
    recurringId: null,
    sentAt: null,
    viewedAt: null,
    createdAt: now,
    updatedAt: now,
  };
  const docLines: InvoiceLine[] = lines.map((l, i) => {
    const rate = active.vatPayer ? l.vatRate : 0;
    const { net, vat } = computeLine({ ...l, vatRate: rate });
    return { id: String(i), invoiceId: "preview", position: i, name: l.name, quantity: Number(l.quantity).toFixed(3), unit: l.unit, unitPrice: toDb(l.unitPrice), vatRate: rate, net: toDb(net), vat: toDb(vat) };
  });
  const html = await renderInvoiceHtml({ company: active, invoice: inv, lines: docLines, bank });
  return new Response(html, { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } });
}
