import Decimal from "decimal.js";
import QRCode from "qrcode";
import type { InvoiceDocument } from "@/lib/invoices";
import { qrInvoice, resolveIban, spayd } from "@/lib/bank";
import { computeTotals } from "@/lib/money";
import { labels, type Labels, type TemplateId } from "./labels";

export type TemplateData = {
  t: Labels;
  lang: "cs" | "en";
  doc: InvoiceDocument;
  title: string;
  money: (v: string | number | Decimal) => string;
  num: (v: string | number) => string;
  date: (iso: string | null | undefined) => string;
  iban: string | null;
  qr: string | null;
  qrF: boolean;
  byRate: { rate: number; base: Decimal; vat: Decimal }[];
  remaining: Decimal;
  accent: string;
  logo: string | null;
  watermark: string | null;
};

export function esc(v: unknown) {
  return String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

export function nl2br(v: string | null | undefined) {
  return esc(v).replace(/\n/g, "<br>");
}

export async function buildTemplateData(doc: InvoiceDocument, opts?: { template?: TemplateId }): Promise<TemplateData> {
  const lang = doc.invoice.language === "en" ? "en" : "cs";
  const t = labels[lang];
  const locale = lang === "cs" ? "cs-CZ" : "en-GB";
  const cur = doc.invoice.currency;
  const money = (v: string | number | Decimal) =>
    new Intl.NumberFormat(locale, { style: "currency", currency: cur, currencyDisplay: lang === "cs" ? "narrowSymbol" : "code" }).format(Number(v.toString()));
  const num = (v: string | number) => new Intl.NumberFormat(locale, { maximumFractionDigits: 3 }).format(Number(v));
  const date = (iso: string | null | undefined) => (iso ? new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(new Date(iso + "T00:00:00")) : "");
  const iban = doc.bank ? resolveIban(doc.bank) : null;
  const remaining = new Decimal(doc.invoice.total).minus(doc.invoice.paidAmount);
  let qr: string | null = null;
  let qrF = false;
  const { byRate } = computeTotals(doc.lines, doc.invoice.vatPayer);
  if (iban && remaining.gt(0) && doc.invoice.status !== "cancelled") {
    const inv = doc.invoice;
    const withInvoice = doc.company.qrType === "spayd_f" && Boolean(inv.number);
    qrF = withInvoice;
    const payload = spayd({
      iban,
      bic: doc.bank?.swift,
      amount: remaining.toFixed(2),
      currency: cur,
      vs: doc.invoice.variableSymbol,
      message: `${doc.invoice.type === "proforma" ? t.proforma : t.invoice} ${doc.invoice.number ?? ""}`.trim(),
      dueDate: doc.invoice.dueDate,
      invoice: withInvoice
        ? qrInvoice({
            number: inv.number!,
            issueDate: inv.issueDate,
            taxDate: inv.taxDate,
            dueDate: inv.dueDate,
            total: new Decimal(inv.total).toFixed(2),
            currency: cur,
            exchangeRate: inv.exchangeRate,
            taxDocument: inv.vatPayer && inv.type === "invoice",
            vs: inv.variableSymbol,
            supplierDic: doc.company.dic,
            supplierIco: doc.company.ico,
            customerDic: inv.customerDic,
            customerIco: inv.customerIco,
            vatByRate: byRate.map((r) => ({ rate: r.rate, base: r.base.toFixed(2), vat: r.vat.toFixed(2) })),
          })
        : null,
    });
    qr = await QRCode.toDataURL(payload, { margin: 0, width: withInvoice ? 400 : 220, errorCorrectionLevel: "M" });
  }
  const title = doc.invoice.type === "proforma" ? t.proforma : t.invoice;
  const watermark = doc.invoice.status === "cancelled" ? t.cancelled : doc.invoice.status === "draft" ? t.draft : null;
  void opts;
  return { t: qrF ? { ...t, qr: t.qrF } : t, qrF, lang, doc, title, money, num, date, iban, qr, byRate, remaining, accent: doc.company.accentColor, logo: doc.company.logoUrl, watermark };
}
