import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { FileDown } from "lucide-react";
import { db } from "@/db";
import { invoice } from "@/db/schema";
import { getInvoiceByToken, getInvoiceDocument } from "@/lib/invoices";
import { labels } from "@/templates/labels";
import { Button } from "@/components/ui/button";

export default async function PublicInvoicePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const inv = await getInvoiceByToken(token);
  if (!inv || inv.status === "draft") notFound();
  if (!inv.viewedAt) await db.update(invoice).set({ viewedAt: new Date() }).where(eq(invoice.id, inv.id));
  const doc = await getInvoiceDocument(inv);
  const lang = inv.language === "en" ? "en" : "cs";
  const t = labels[lang];
  const money = new Intl.NumberFormat(lang === "cs" ? "cs-CZ" : "en-GB", { style: "currency", currency: inv.currency }).format(Number(inv.total));
  const due = new Intl.DateTimeFormat(lang === "cs" ? "cs-CZ" : "en-GB", { dateStyle: "medium" }).format(new Date(inv.dueDate + "T00:00:00"));
  const title = inv.type === "proforma" ? t.proforma : t.invoice;
  return (
    <div className="min-h-full bg-[#e9e9ec]">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div>
            <div className="text-sm text-muted-foreground">{doc.company.name}</div>
            <div className="font-semibold">
              {title} {inv.number}
              {inv.status === "paid" && <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">{t.paid}</span>}
              {inv.status === "cancelled" && <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs font-medium">{t.cancelled}</span>}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right text-sm">
              <div className="font-semibold tabular-nums">{money}</div>
              <div className="text-muted-foreground">{t.dueDate}: {due}</div>
            </div>
            <Button render={<a href={`/i/${token}/pdf`} />}>
              <FileDown />
              PDF
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-2 py-4">
        <iframe title={title} src={`/i/${token}/preview`} className="h-[1150px] w-full" />
      </main>
    </div>
  );
}
