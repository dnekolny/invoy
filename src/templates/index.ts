import type { InvoiceDocument } from "@/lib/invoices";
import { classicTemplate } from "./classic";
import { buildTemplateData } from "./data";
import type { TemplateId } from "./labels";
import { modernTemplate } from "./modern";

const renderers: Record<TemplateId, (d: Awaited<ReturnType<typeof buildTemplateData>>) => string> = {
  classic: classicTemplate,
  modern: modernTemplate,
};

export async function renderInvoiceHtml(doc: InvoiceDocument, template?: TemplateId) {
  const id = (template ?? doc.company.template) as TemplateId;
  const data = await buildTemplateData(doc);
  return (renderers[id] ?? classicTemplate)(data);
}

export function invoiceFileName(doc: InvoiceDocument) {
  const base = doc.invoice.type === "proforma" ? (doc.invoice.language === "en" ? "proforma" : "zalohova-faktura") : (doc.invoice.language === "en" ? "invoice" : "faktura");
  return `${base}-${doc.invoice.number ?? "koncept"}.pdf`;
}
