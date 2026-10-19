import type { TemplateData } from "./data";
import { esc } from "./data";
import { baseCss, datesBlock, fontLink, footer, introBlock, linesTable, noteBlock, partyBlock, paymentBlock, qrBlock, totalsBlock, watermark } from "./shared";

export function modernTemplate(d: TemplateData) {
  const { t, doc, accent, title, money } = d;
  const i = doc.invoice;
  return `<!doctype html><html lang="${d.lang}"><head><meta charset="utf-8"><title>${esc(title)} ${esc(i.number ?? "")}</title>${fontLink()}<style>${baseCss}
    .page { padding-top: 0; }
    .band { background:${accent}; color:#fff; margin: 0 -16mm 10mm; padding: 14mm 16mm 10mm; display:flex; justify-content:space-between; align-items:flex-end; }
    .band h1 { margin:0; font-size: 24pt; font-weight: 800; letter-spacing: -.02em; }
    .band .no { font-size: 12pt; opacity:.9; margin-top:2px; }
    .band .total { text-align:right; }
    .band .total .lbl { font-size: 8.5pt; text-transform: uppercase; letter-spacing:.08em; opacity:.85; }
    .band .total .val { font-size: 20pt; font-weight: 700; }
    .parties { display:grid; grid-template-columns: 1fr 1fr; gap: 12mm; margin-bottom: 8mm; }
    .meta { display:grid; grid-template-columns: 1.25fr 1fr; gap: 10mm; margin-bottom: 8mm; background:#f8fafc; border-radius: 3mm; padding: 5mm 6mm; }
    .bottom { display:flex; justify-content:space-between; align-items:flex-start; gap: 10mm; margin-top: 6mm; }
    .party h3 { color:${accent}; }
  </style></head><body><div class="page">
    ${watermark(d)}
    <div class="band">
      <div>
        ${d.logo ? `<img src="${d.logo}" alt="" style="max-height:16mm;max-width:50mm;object-fit:contain;margin-bottom:4mm;display:block;filter:drop-shadow(0 0 0 #fff)">` : ""}
        <h1>${esc(title)}</h1>
        <div class="no">${esc(i.number ?? "")}${i.vatPayer && i.type === "invoice" ? ` · ${t.taxDoc}` : ""}</div>
      </div>
      <div class="total"><div class="lbl">${t.totalDue}</div><div class="val">${money(i.total)}</div><div class="small" style="opacity:.9">${t.dueDate}: ${d.date(i.dueDate)}</div></div>
    </div>
    <div class="parties">${partyBlock(d, "supplier")}${partyBlock(d, "customer")}</div>
    <div class="meta">${paymentBlock(d)}${datesBlock(d)}</div>
    ${introBlock(d)}
    ${linesTable(d, { headerBg: accent, headerColor: "#fff", border: "#e5e7eb" })}
    <div class="bottom">
      <div>${qrBlock(d)}</div>
      <div>${totalsBlock(d, accent)}</div>
    </div>
    ${noteBlock(d)}
    ${footer(d)}
  </div></body></html>`;
}
