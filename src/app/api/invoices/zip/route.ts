import { and, asc, eq, inArray } from "drizzle-orm";
import { zipSync } from "fflate";
import { db } from "@/db";
import { invoice } from "@/db/schema";
import { requireCompany } from "@/lib/company";
import { getInvoiceDocument } from "@/lib/invoices";
import { htmlsToPdf } from "@/lib/pdf";
import { invoiceFileName, renderInvoiceHtml } from "@/templates";

export const maxDuration = 120;

export async function GET(req: Request) {
  const active = await requireCompany();
  const ids = new URL(req.url).searchParams.get("ids")?.split(",").filter(Boolean).slice(0, 100) ?? [];
  if (!ids.length) return new Response("Bad request", { status: 400 });
  const rows = await db
    .select()
    .from(invoice)
    .where(and(eq(invoice.companyId, active.id), inArray(invoice.id, ids)))
    .orderBy(asc(invoice.issueDate), asc(invoice.number));
  if (!rows.length) return new Response("Not found", { status: 404 });
  const docs = await Promise.all(rows.map((inv) => getInvoiceDocument(inv)));
  const pdfs = await htmlsToPdf(await Promise.all(docs.map((doc) => renderInvoiceHtml(doc))));
  const files: Record<string, Uint8Array> = {};
  docs.forEach((doc, i) => {
    const base = invoiceFileName(doc);
    let name = base;
    for (let n = 2; files[name]; n++) name = base.replace(/\.pdf$/, `-${n}.pdf`);
    files[name] = pdfs[i];
  });
  const zip = zipSync(files, { level: 0 });
  return new Response(Buffer.from(zip), {
    headers: { "content-type": "application/zip", "content-disposition": 'attachment; filename="faktury.zip"', "cache-control": "no-store" },
  });
}
