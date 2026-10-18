import { requireCompany } from "@/lib/company";
import { companyBankAccounts } from "@/lib/invoices";
import { renderInvoiceHtml } from "@/templates";
import type { TemplateId } from "@/templates/labels";
import type { Invoice, InvoiceLine } from "@/db/schema";

export async function GET(req: Request) {
  const active = await requireCompany();
  const url = new URL(req.url);
  const template = (url.searchParams.get("template") ?? active.template) as TemplateId;
  const accent = url.searchParams.get("accent");
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
    note: "Ukázková faktura pro náhled šablony.", publicToken: "sample", proformaId: null, recurringId: null, sentAt: null, viewedAt: null, createdAt: new Date(), updatedAt: new Date(),
  };
  const company = accent ? { ...active, accentColor: accent } : active;
  const html = await renderInvoiceHtml({ company, invoice: inv, lines, bank: bank ?? null }, template);
  return new Response(html, { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } });
}
