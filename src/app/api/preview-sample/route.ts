import { requireCompany } from "@/lib/company";
import { renderSampleInvoice } from "@/lib/sample-invoice";

export async function GET(req: Request) {
  const url = new URL(req.url);
  return render({ template: url.searchParams.get("template"), accent: url.searchParams.get("accent") });
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { template?: string; accent?: string; logoUrl?: string | null; customHtml?: string };
  return render({ template: body.template ?? null, accent: body.accent ?? null, logoUrl: body.logoUrl, customHtml: body.customHtml });
}

async function render(opts: Parameters<typeof renderSampleInvoice>[1]) {
  const active = await requireCompany();
  const html = await renderSampleInvoice(active, opts);
  return new Response(html, { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } });
}
