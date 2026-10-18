import { requireCompany } from "@/lib/company";
import { getInvoiceDocument, getInvoiceWithLines } from "@/lib/invoices";
import { htmlToPdf } from "@/lib/pdf";
import { invoiceFileName, renderInvoiceHtml } from "@/templates";

export const maxDuration = 60;

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const active = await requireCompany();
  const inv = await getInvoiceWithLines(active.id, id);
  if (!inv) return new Response("Not found", { status: 404 });
  const doc = await getInvoiceDocument(inv);
  const pdf = await htmlToPdf(await renderInvoiceHtml(doc));
  return new Response(Buffer.from(pdf), {
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `inline; filename="${invoiceFileName(doc)}"`,
      "cache-control": "no-store",
    },
  });
}
