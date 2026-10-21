import { requireCompany } from "@/lib/company";
import { getInvoiceDocument, getInvoiceWithLines } from "@/lib/invoices";
import { renderInvoiceHtml } from "@/templates";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const active = await requireCompany();
  const inv = await getInvoiceWithLines(active.id, id);
  if (!inv) return new Response("Not found", { status: 404 });
  const template = new URL(req.url).searchParams.get("template");
  const html = await renderInvoiceHtml(await getInvoiceDocument(inv), template ?? undefined);
  return new Response(html, { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } });
}
