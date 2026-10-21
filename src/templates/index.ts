import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { customTemplate } from "@/db/schema";
import type { InvoiceDocument } from "@/lib/invoices";
import { classicTemplate } from "./classic";
import { renderCustomTemplate } from "./custom";
import { buildTemplateData } from "./data";
import { TEMPLATES, type TemplateId } from "./labels";
import { modernTemplate } from "./modern";

const renderers: Record<TemplateId, (d: Awaited<ReturnType<typeof buildTemplateData>>) => string> = {
  classic: classicTemplate,
  modern: modernTemplate,
};

export async function renderInvoiceHtml(doc: InvoiceDocument, template?: string, customHtml?: string) {
  const id = template ?? doc.company.template;
  const data = await buildTemplateData(doc);
  if (customHtml) return renderCustomTemplate(customHtml, data);
  if (!TEMPLATES.some((t) => t.id === id) && /^[0-9a-f-]{36}$/.test(id)) {
    const [row] = await db.select().from(customTemplate).where(and(eq(customTemplate.id, id), eq(customTemplate.companyId, doc.company.id))).limit(1);
    if (row) return renderCustomTemplate(row.html, data);
  }
  return (renderers[id as TemplateId] ?? classicTemplate)(data);
}

export function invoiceFileName(doc: InvoiceDocument) {
  const base = doc.invoice.type === "proforma" ? (doc.invoice.language === "en" ? "proforma" : "zalohova-faktura") : (doc.invoice.language === "en" ? "invoice" : "faktura");
  return `${base}-${doc.invoice.number ?? "koncept"}.pdf`;
}
