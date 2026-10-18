import { getInvoiceByToken, getInvoiceDocument } from "@/lib/invoices";
import { renderInvoiceHtml } from "@/templates";

export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const inv = await getInvoiceByToken(token);
  if (!inv || inv.status === "draft") return new Response("Not found", { status: 404 });
  const html = await renderInvoiceHtml(await getInvoiceDocument(inv));
  return new Response(html, { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } });
}
