import type { TemplateData } from "./data";
import { esc } from "./data";
import { baseCss, datesBlock, fontLink, footer, introBlock, linesTable, noteBlock, partyBlock, paymentBlock, qrBlock, totalsBlock, watermark } from "./shared";

export function classicTemplate(d: TemplateData) {
  const { t, doc, accent, title } = d;
  const i = doc.invoice;
  return `<!doctype html><html lang="${d.lang}"><head><meta charset="utf-8"><title>${esc(title)} ${esc(i.number ?? "")}</title>${fontLink()}<style>${baseCss}
    .head { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom: 10mm; }
    .head h1 { margin:0; font-size: 22pt; font-weight: 700; letter-spacing: -.01em; }
    .head .no { font-size: 13pt; color:#374151; margin-top: 2px; }
    .parties { display:grid; grid-template-columns: 1fr 1fr; gap: 12mm; margin-bottom: 8mm; }
    .meta { display:grid; grid-template-columns: 1.25fr 1fr; gap: 10mm; margin-bottom: 8mm; padding: 5mm 0; border-top: 1px solid #e5e7eb; border-bottom: 1px solid #e5e7eb; }
    .bottom { display:flex; justify-content:space-between; align-items:flex-start; gap: 10mm; margin-top: 6mm; }
  </style></head><body><div class="page">
    ${watermark(d)}
    <div class="head">
      <div>
        <h1>${esc(title)}</h1>
        <div class="no">${esc(i.number ?? "")}</div>
        ${i.vatPayer && i.type === "invoice" ? `<div class="small muted">${t.taxDoc}</div>` : ""}
      </div>
      ${d.logo ? `<img src="${d.logo}" alt="" style="max-height:22mm;max-width:60mm;object-fit:contain">` : `<div style="width:14mm;height:14mm;border-radius:3mm;background:${accent}"></div>`}
    </div>
    <div class="parties">${partyBlock(d, "supplier")}${partyBlock(d, "customer")}</div>
    <div class="meta">${paymentBlock(d)}${datesBlock(d)}</div>
    ${introBlock(d)}
    ${linesTable(d, { headerBg: "#f3f4f6", headerColor: "#374151", border: "#e5e7eb" })}
    <div class="bottom">
      <div>${qrBlock(d)}</div>
      <div>${totalsBlock(d, accent)}</div>
    </div>
    ${noteBlock(d)}
    ${footer(d)}
  </div></body></html>`;
}
