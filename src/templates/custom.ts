import Decimal from "decimal.js";
import type { TemplateData } from "./data";
import { esc, nl2br } from "./data";
import { baseCss, countryName, datesBlock, fontLink, footer, introBlock, linesTable, noteBlock, partyBlock, paymentBlock, qrBlock, totalsBlock, watermark } from "./shared";

type Ctx = Record<string, unknown>;

export function customContext(d: TemplateData): Ctx {
  const { doc, t, money, num, date } = d;
  const c = doc.company;
  const i = doc.invoice;
  const paid = new Decimal(i.paidAmount);
  const party = (p: { name: string; street: string | null; city: string | null; zip: string | null; country: string | null; ico: string | null; dic: string | null }) => ({
    ...p,
    countryName: p.country && p.country !== "CZ" ? countryName(p.country, d.lang) : "",
    cityLine: [p.zip, p.city].filter(Boolean).join(" "),
  });
  return {
    title: d.title,
    lang: d.lang,
    isProforma: i.type === "proforma",
    isVatPayer: i.vatPayer,
    isTaxDoc: i.vatPayer && i.type === "invoice",
    number: i.number ?? "",
    variableSymbol: i.variableSymbol ?? "",
    currency: i.currency,
    issueDate: date(i.issueDate),
    taxDate: date(i.taxDate ?? i.issueDate),
    dueDate: date(i.dueDate),
    intro: i.intro ?? "",
    introHtml: nl2br(i.intro),
    note: i.note ?? "",
    noteHtml: nl2br(i.note),
    footerText: c.footerText ?? "",
    footerHtml: nl2br(c.footerText),
    accent: d.accent,
    logo: d.logo ?? "",
    qr: d.qr ?? "",
    watermark: d.watermark ?? "",
    supplier: { ...party({ name: c.name, street: c.street, city: c.city, zip: c.zip, country: c.country, ico: c.ico, dic: c.dic }), email: c.email ?? "", phone: c.phone ?? "", web: c.web ?? "", registrationNote: c.registrationNote ?? "" },
    customer: { ...party({ name: i.customerName, street: i.customerStreet, city: i.customerCity, zip: i.customerZip, country: i.customerCountry, ico: i.customerIco, dic: i.customerDic }), email: i.customerEmail ?? "" },
    bank: {
      account: doc.bank?.accountNumber ? `${doc.bank.accountNumber}/${doc.bank.bankCode ?? ""}` : "",
      iban: d.iban ? d.iban.replace(/(.{4})/g, "$1 ").trim() : "",
      swift: doc.bank?.swift ?? "",
    },
    lines: doc.lines.map((l, idx) => ({
      index: idx + 1,
      name: l.name,
      quantity: num(l.quantity),
      unit: l.unit,
      unitPrice: money(l.unitPrice),
      vatRate: l.vatRate,
      net: money(l.net),
      vat: money(l.vat),
      total: money(new Decimal(l.net).plus(l.vat)),
    })),
    byRate: d.byRate.map((r) => ({ rate: r.rate, base: money(r.base), vat: money(r.vat) })),
    totals: {
      subtotal: money(i.subtotal),
      vatTotal: money(i.vatTotal),
      total: money(i.total),
      paid: money(paid),
      remaining: money(d.remaining),
      hasPayment: paid.gt(0),
    },
    labels: t,
    blocks: {
      css: baseCss,
      fonts: fontLink(),
      supplier: partyBlock(d, "supplier"),
      customer: partyBlock(d, "customer"),
      lines: linesTable(d, { headerBg: "#f3f4f6", headerColor: "#374151", border: "#e5e7eb" }),
      linesAccent: linesTable(d, { headerBg: d.accent, headerColor: "#fff", border: "#e5e7eb" }),
      totals: totalsBlock(d, d.accent),
      payment: paymentBlock(d),
      dates: datesBlock(d),
      intro: introBlock(d),
      note: noteBlock(d),
      qr: qrBlock(d),
      watermark: watermark(d),
      footer: footer(d),
    },
  };
}

function lookup(path: string, stack: Ctx[]): unknown {
  if (path === "this") return stack[stack.length - 1];
  const parts = path.split(".");
  for (let s = stack.length - 1; s >= 0; s--) {
    let cur: unknown = stack[s];
    let ok = true;
    for (const part of parts) {
      if (cur !== null && typeof cur === "object" && part in (cur as object)) cur = (cur as Ctx)[part];
      else {
        ok = false;
        break;
      }
    }
    if (ok) return cur;
  }
  return undefined;
}

const TOKEN = /\{\{\{\s*([\w.]+)\s*\}\}\}|\{\{\s*(#each|#if|\/each|\/if|else)?\s*([\w.]*)\s*\}\}/g;

export function renderTemplateString(src: string, root: Ctx): string {
  const tokens: { type: "text" | "raw" | "var" | "each" | "if" | "end" | "else"; value: string }[] = [];
  let last = 0;
  for (const m of src.matchAll(TOKEN)) {
    if (m.index! > last) tokens.push({ type: "text", value: src.slice(last, m.index) });
    if (m[1] !== undefined) tokens.push({ type: "raw", value: m[1] });
    else if (m[2] === "#each") tokens.push({ type: "each", value: m[3] });
    else if (m[2] === "#if") tokens.push({ type: "if", value: m[3] });
    else if (m[2] === "/each" || m[2] === "/if") tokens.push({ type: "end", value: "" });
    else if (m[2] === "else") tokens.push({ type: "else", value: "" });
    else tokens.push({ type: "var", value: m[3] });
    last = m.index! + m[0].length;
  }
  if (last < src.length) tokens.push({ type: "text", value: src.slice(last) });

  let pos = 0;
  function block(stack: Ctx[], stopAtElse: boolean): { out: string; hitElse: boolean } {
    let out = "";
    while (pos < tokens.length) {
      const tk = tokens[pos++];
      if (tk.type === "text") out += tk.value;
      else if (tk.type === "var") out += esc(lookup(tk.value, stack) ?? "");
      else if (tk.type === "raw") out += String(lookup(tk.value, stack) ?? "");
      else if (tk.type === "end") return { out, hitElse: false };
      else if (tk.type === "else") {
        if (stopAtElse) return { out, hitElse: true };
      } else if (tk.type === "if") {
        const cond = lookup(tk.value, stack);
        const truthy = Array.isArray(cond) ? cond.length > 0 : Boolean(cond);
        const a = block(stack, true);
        if (a.hitElse) {
          const b = block(stack, false);
          out += truthy ? a.out : b.out;
        } else out += truthy ? a.out : "";
      } else if (tk.type === "each") {
        const list = lookup(tk.value, stack);
        const start = pos;
        if (Array.isArray(list) && list.length) {
          for (const item of list) {
            pos = start;
            const ctx = item !== null && typeof item === "object" ? (item as Ctx) : { this: item };
            out += block([...stack, ctx], false).out;
          }
        } else block(stack, false);
      }
    }
    return { out, hitElse: false };
  }
  return block([root], false).out;
}

export function renderCustomTemplate(html: string, d: TemplateData) {
  return renderTemplateString(html, customContext(d));
}

export function validateCustomTemplate(html: string): string | null {
  if (!/\{\{\{?\s*blocks\.lines(Accent)?\s*\}?\}\}|\{\{\s*#each\s+lines\s*\}\}/.test(html)) return "lines";
  if (!/\{\{\{?\s*(blocks\.totals|totals\.total)\s*\}?\}\}/.test(html)) return "totals";
  return null;
}
