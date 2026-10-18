import type { TemplateData } from "./data";
import { esc, nl2br } from "./data";

export const baseCss = `
  @page { size: A4; margin: 0; }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }
  body { font-family: "Inter", "Segoe UI", Roboto, Arial, sans-serif; font-size: 10.5pt; color: #1a1a1a; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .page { width: 210mm; min-height: 297mm; padding: 16mm 16mm 14mm; margin: 0 auto; background: #fff; position: relative; }
  @media screen { body { background: #e9e9ec; padding: 24px 0; } .page { box-shadow: 0 2px 16px rgba(0,0,0,.12); } }
  table { border-collapse: collapse; width: 100%; }
  .num { text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; }
  .muted { color: #6b7280; }
  .small { font-size: 9pt; }
  .watermark { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; pointer-events: none; }
  .watermark span { font-size: 90pt; font-weight: 800; color: rgba(220, 38, 38, .12); transform: rotate(-28deg); letter-spacing: .1em; }
  .party h3 { margin: 0 0 4px; font-size: 8.5pt; text-transform: uppercase; letter-spacing: .08em; color: #6b7280; font-weight: 600; }
  .party .name { font-weight: 600; font-size: 12pt; margin-bottom: 2px; }
  .party div { line-height: 1.45; }
  .footer { position: absolute; left: 16mm; right: 16mm; bottom: 10mm; font-size: 8.5pt; color: #6b7280; border-top: 1px solid #e5e7eb; padding-top: 6px; }
`;

export function fontLink() {
  return `<link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap&subset=latin-ext" rel="stylesheet">`;
}

export function partyBlock(d: TemplateData, kind: "supplier" | "customer") {
  const { t, doc } = d;
  const c = doc.company;
  const i = doc.invoice;
  const p =
    kind === "supplier"
      ? { name: c.name, street: c.street, city: c.city, zip: c.zip, country: c.country, ico: c.ico, dic: c.dic, extra: [c.email, c.phone, c.web].filter(Boolean) }
      : { name: i.customerName, street: i.customerStreet, city: i.customerCity, zip: i.customerZip, country: i.customerCountry, ico: i.customerIco, dic: i.customerDic, extra: [] as (string | null)[] };
  const countryLine = p.country && p.country !== "CZ" ? `<div>${esc(countryName(p.country, d.lang))}</div>` : "";
  return `<div class="party">
    <h3>${kind === "supplier" ? t.supplier : t.customer}</h3>
    <div class="name">${esc(p.name)}</div>
    ${p.street ? `<div>${esc(p.street)}</div>` : ""}
    ${p.zip || p.city ? `<div>${esc([p.zip, p.city].filter(Boolean).join(" "))}</div>` : ""}
    ${countryLine}
    <div style="margin-top:6px">
      ${p.ico ? `<div>${t.ico}: ${esc(p.ico)}</div>` : ""}
      ${p.dic ? `<div>${t.dic}: ${esc(p.dic)}</div>` : kind === "supplier" && !c.vatPayer ? `<div>${t.notVatPayer}</div>` : ""}
      ${kind === "supplier" && c.registrationNote ? `<div class="small muted" style="margin-top:4px">${esc(c.registrationNote)}</div>` : ""}
    </div>
    ${p.extra.length ? `<div class="small muted" style="margin-top:6px">${p.extra.map(esc).join(" · ")}</div>` : ""}
  </div>`;
}

export function countryName(code: string, lang: "cs" | "en") {
  try {
    return new Intl.DisplayNames([lang === "cs" ? "cs" : "en"], { type: "region" }).of(code) ?? code;
  } catch {
    return code;
  }
}

export function linesTable(d: TemplateData, opts: { headerBg: string; headerColor: string; border: string }) {
  const { t, doc, money, num } = d;
  const vat = doc.invoice.vatPayer;
  const th = (s: string, cls = "") => `<th class="${cls}" style="padding:7px 8px;font-size:8.5pt;text-transform:uppercase;letter-spacing:.05em;font-weight:600;background:${opts.headerBg};color:${opts.headerColor};text-align:${cls.includes("num") ? "right" : "left"}">${s}</th>`;
  const td = (s: string, cls = "") => `<td class="${cls}" style="padding:7px 8px;border-bottom:1px solid ${opts.border};vertical-align:top">${s}</td>`;
  return `<table>
    <thead><tr>
      ${th(t.item)}${th(t.qty, "num")}${th(t.unitPrice, "num")}${vat ? th(t.vat, "num") : ""}${th(vat ? t.net : t.total, "num")}
    </tr></thead>
    <tbody>
      ${doc.lines
        .map(
          (l) => `<tr>
        ${td(esc(l.name))}
        ${td(`${num(l.quantity)} ${esc(l.unit)}`, "num")}
        ${td(money(l.unitPrice), "num")}
        ${vat ? td(`${l.vatRate} %`, "num") : ""}
        ${td(money(l.net), "num")}
      </tr>`
        )
        .join("")}
    </tbody>
  </table>`;
}

export function totalsBlock(d: TemplateData, accent: string) {
  const { t, doc, money, byRate, remaining } = d;
  const i = doc.invoice;
  const vat = i.vatPayer;
  const row = (k: string, v: string, strong = false) =>
    `<tr><td style="padding:4px 8px;${strong ? "font-weight:700;font-size:12pt" : ""}">${k}</td><td class="num" style="padding:4px 8px;${strong ? "font-weight:700;font-size:12pt" : ""}">${v}</td></tr>`;
  let vatRows = "";
  if (vat) {
    vatRows = byRate.map((r) => row(`${t.base} ${r.rate} %`, `${money(r.base)}`) + row(`${t.vat} ${r.rate} %`, `${money(r.vat)}`)).join("");
  }
  const paid = new Decimal(i.paidAmount);
  const paidRows = paid.gt(0) ? row(t.paid, `−${money(paid)}`) + row(t.remaining, money(remaining), true) : "";
  const czk =
    vat && i.exchangeRate && i.currency !== "CZK"
      ? `<div class="small muted" style="margin-top:6px;text-align:right">${t.rate_cnb}: 1 ${i.currency} = ${Number(i.exchangeRate).toLocaleString(d.lang === "cs" ? "cs-CZ" : "en-GB", { maximumFractionDigits: 3 })} CZK · ${t.vatInCzk}: ${new Intl.NumberFormat(d.lang === "cs" ? "cs-CZ" : "en-GB", { style: "currency", currency: "CZK" }).format(Number(i.vatTotal) * Number(i.exchangeRate))}</div>`
      : "";
  return `<table style="width:auto;min-width:72mm;margin-left:auto">
    ${vat ? row(t.subtotal, money(i.subtotal)) + vatRows + row(t.vatTotal, money(i.vatTotal)) : ""}
    <tr><td colspan="2" style="padding:0"><div style="border-top:2px solid ${accent};margin:4px 0"></div></td></tr>
    ${row(t.totalDue, money(i.total), !paid.gt(0))}
    ${paidRows}
  </table>${czk}`;
}

export function paymentBlock(d: TemplateData) {
  const { t, doc, iban } = d;
  const b = doc.bank;
  const i = doc.invoice;
  const rows: [string, string][] = [[t.paymentMethod, t.transfer]];
  if (b?.accountNumber) rows.push([t.account, `${b.accountNumber}/${b.bankCode ?? ""}`]);
  if (iban) rows.push([t.iban, iban.replace(/(.{4})/g, "$1 ").trim()]);
  if (b?.swift) rows.push([t.swift, b.swift]);
  if (i.variableSymbol) rows.push([t.vs, i.variableSymbol]);
  return `<table style="width:auto">${rows.map(([k, v]) => `<tr><td class="muted" style="padding:2px 12px 2px 0;white-space:nowrap">${k}</td><td style="padding:2px 0;font-weight:500;white-space:nowrap">${esc(v)}</td></tr>`).join("")}</table>`;
}

export function datesBlock(d: TemplateData) {
  const { t, doc, date } = d;
  const i = doc.invoice;
  const rows: [string, string][] = [[t.issueDate, date(i.issueDate)]];
  if (i.vatPayer && i.type === "invoice") rows.push([t.taxDate, date(i.taxDate ?? i.issueDate)]);
  rows.push([t.dueDate, date(i.dueDate)]);
  return `<table style="width:auto">${rows.map(([k, v]) => `<tr><td class="muted" style="padding:2px 12px 2px 0;white-space:nowrap">${k}</td><td style="padding:2px 0;font-weight:500;white-space:nowrap">${esc(v)}</td></tr>`).join("")}</table>`;
}

export function noteBlock(d: TemplateData) {
  const { t, doc } = d;
  const parts: string[] = [];
  if (doc.invoice.type === "proforma") parts.push(`<div class="small muted">${t.proformaNote}</div>`);
  if (doc.invoice.note) parts.push(`<div><strong class="small muted" style="text-transform:uppercase;letter-spacing:.05em">${t.note}</strong><div style="margin-top:2px">${nl2br(doc.invoice.note)}</div></div>`);
  return parts.length ? `<div style="margin-top:14px;display:flex;flex-direction:column;gap:8px">${parts.join("")}</div>` : "";
}

export function qrBlock(d: TemplateData) {
  if (!d.qr) return "";
  return `<div style="text-align:center"><img src="${d.qr}" alt="QR" style="width:30mm;height:30mm;display:block;margin:0 auto 3px"><div class="small muted">${d.t.qr}</div></div>`;
}

export function watermark(d: TemplateData) {
  return d.watermark ? `<div class="watermark"><span>${d.watermark}</span></div>` : "";
}

export function footer(d: TemplateData) {
  const txt = d.doc.company.footerText;
  return txt ? `<div class="footer">${nl2br(txt)}</div>` : "";
}

import Decimal from "decimal.js";
