import { getInvoiceByToken, getInvoiceDocument } from "@/lib/invoices";
import { htmlToPdf } from "@/lib/pdf";
import { invoiceFileName, renderInvoiceHtml } from "@/templates";

export const maxDuration = 60;

export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const inv = await getInvoiceByToken(token);
  if (!inv || inv.status === "draft") return new Response("Not found", { status: 404 });
  const doc = await getInvoiceDocument(inv);
  const pdf = await htmlToPdf(await renderInvoiceHtml(doc));
  return new Response(Buffer.from(pdf), {
    headers: { "content-type": "application/pdf", "content-disposition": `attachment; filename="${invoiceFileName(doc)}"`, "cache-control": "no-store" },
  });
}
