import { requireCompany } from "@/lib/company";
import { companyBankAccounts } from "@/lib/invoices";
import { renderInvoiceHtml } from "@/templates";
import type { Invoice, InvoiceLine } from "@/db/schema";

export async function GET(req: Request) {
  const url = new URL(req.url);
  return render({ template: url.searchParams.get("template"), accent: url.searchParams.get("accent"), logoUrl: undefined });
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { template?: string; accent?: string; logoUrl?: string | null; customHtml?: string };
  return render({ template: body.template ?? null, accent: body.accent ?? null, logoUrl: body.logoUrl, customHtml: body.customHtml });
}

async function render(opts: { template: string | null; accent: string | null; logoUrl: string | null | undefined; customHtml?: string }) {
  const active = await requireCompany();
  const template = opts.template ?? active.template;
  const customHtml = opts.customHtml && active.premium && opts.customHtml.length <= 200_000 ? opts.customHtml : undefined;
  const accent = opts.accent && /^#[0-9a-f]{6}$/i.test(opts.accent) ? opts.accent : null;
  const [bank] = await companyBankAccounts(active.id);
  const today = new Date().toISOString().slice(0, 10);
  const vat = active.vatPayer;
  const lines: InvoiceLine[] = [
    { id: "1", invoiceId: "x", position: 0, name: active.defaultCurrency === "EUR" ? "Consulting services" : "Konzultační služby", quantity: "8.000", unit: "hod", unitPrice: "1500.00", vatRate: vat ? 21 : 0, net: "12000.00", vat: vat ? "2520.00" : "0.00" },
    { id: "2", invoiceId: "x", position: 1, name: active.defaultCurrency === "EUR" ? "Web hosting" : "Webhosting", quantity: "1.000", unit: "ks", unitPrice: "490.00", vatRate: vat ? 21 : 0, net: "490.00", vat: vat ? "102.90" : "0.00" },
  ];
  const subtotal = 12490;
  const vatTotal = vat ? 2622.9 : 0;
  const inv: Invoice = {
    id: "sample", companyId: active.id, customerId: null, type: "invoice", status: "issued", number: "2026001", variableSymbol: "2026001",
    issueDate: today, taxDate: today, dueDate: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10), currency: active.defaultCurrency, exchangeRate: null,
    language: "cs", vatPayer: vat, bankAccountId: bank?.id ?? null,
    customerName: "Vzorový zákazník s.r.o.", customerIco: "12345678", customerDic: vat ? "CZ12345678" : null, customerStreet: "Náměstí 1", customerCity: "Brno", customerZip: "602 00", customerCountry: "CZ", customerEmail: null,
    subtotal: subtotal.toFixed(2), vatTotal: vatTotal.toFixed(2), total: (subtotal + vatTotal).toFixed(2), paidAmount: "0", paidAt: null,
    intro: active.defaultCurrency === "EUR" ? "We invoice you for services provided in October." : "Fakturujeme vám za služby poskytnuté v říjnu.", note: "Ukázková faktura pro náhled šablony.", reminderCount: 0, lastReminderAt: null, publicToken: "sample", proformaId: null, recurringId: null, sentAt: null, viewedAt: null, createdAt: new Date(), updatedAt: new Date(),
  };
  const company = { ...active, accentColor: accent ?? active.accentColor, logoUrl: opts.logoUrl === undefined ? active.logoUrl : opts.logoUrl };
  const html = await renderInvoiceHtml({ company, invoice: inv, lines, bank: bank ?? null }, template, customHtml);
  return new Response(html, { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } });
}
