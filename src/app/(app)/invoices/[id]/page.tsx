import Link from "next/link";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { ExternalLink, FileDown, Pencil } from "lucide-react";
import { db } from "@/db";
import { emailChannel } from "@/db/schema";
import { requireCompany } from "@/lib/company";
import { formatDate, formatMoney } from "@/lib/format";
import { effectiveStatus, getInvoiceActivity, getInvoiceWithLines } from "@/lib/invoices";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { InvoiceActions } from "./invoice-actions";
import { PaymentsCard } from "./payments-card";
import { SendDialog } from "./send-dialog";

export default async function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const active = await requireCompany();
  const inv = await getInvoiceWithLines(active.id, id);
  if (!inv) notFound();
  const [t, locale, activity, [channel]] = await Promise.all([
    getTranslations("invoiceDetail"),
    getLocale(),
    getInvoiceActivity(id),
    db.select({ id: emailChannel.id, subjectTemplate: emailChannel.subjectTemplate, bodyTemplate: emailChannel.bodyTemplate }).from(emailChannel).where(eq(emailChannel.companyId, active.id)).limit(1),
  ]);
  const status = effectiveStatus(inv);
  const editable = inv.status !== "paid" && inv.status !== "cancelled";
  const publicUrl = `${process.env.BETTER_AUTH_URL}/i/${inv.publicToken}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold">
              {inv.type === "proforma" ? t("proforma") : t("invoice")} {inv.number ?? <span className="text-muted-foreground">{t("draft")}</span>}
            </h1>
            <StatusBadge status={status} />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {inv.customerName || "—"} · {formatMoney(inv.total, inv.currency, locale)} · {t("due")} {formatDate(inv.dueDate, locale)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {editable && (
            <Button variant="outline" size="sm" render={<Link href={`/invoices/${inv.id}/edit`} />}>
              <Pencil />
              {t("edit")}
            </Button>
          )}
          <Button variant="outline" size="sm" render={<a href={`/api/invoices/${inv.id}/pdf`} />}>
            <FileDown />
            PDF
          </Button>
          {inv.status !== "draft" && (
            <SendDialog
              invoiceId={inv.id}
              defaultTo={inv.customerEmail ?? ""}
              hasChannel={Boolean(channel)}
              context={{
                number: inv.number ?? "",
                total: formatMoney(inv.total, inv.currency, inv.language),
                dueDate: formatDate(inv.dueDate, inv.language),
                company: active.name,
                customer: inv.customerName,
                link: publicUrl,
                lang: inv.language,
                type: inv.type,
              }}
              templates={{ subject: channel?.subjectTemplate ?? null, body: channel?.bodyTemplate ?? null }}
            />
          )}
          <InvoiceActions invoice={{ id: inv.id, status: inv.status, type: inv.type, customerId: inv.customerId, proformaId: inv.proformaId }} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="overflow-hidden rounded-lg border bg-[#e9e9ec]">
          <iframe title="preview" src={`/api/invoices/${inv.id}/preview`} className="h-[1120px] w-full" />
        </div>
        <div className="space-y-6">
          {inv.status !== "draft" && inv.status !== "cancelled" && (
            <PaymentsCard invoiceId={inv.id} currency={inv.currency} total={inv.total} paidAmount={inv.paidAmount} payments={activity.payments} />
          )}
          {inv.status !== "draft" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t("publicLink")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <a href={publicUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 break-all text-primary underline">
                  {publicUrl}
                  <ExternalLink className="size-3 shrink-0" />
                </a>
                <p className="text-muted-foreground">
                  {inv.viewedAt ? t("viewedAt", { date: new Intl.DateTimeFormat(locale === "cs" ? "cs-CZ" : "en-GB", { dateStyle: "medium", timeStyle: "short" }).format(inv.viewedAt) }) : t("notViewed")}
                </p>
              </CardContent>
            </Card>
          )}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("history")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {activity.mails.length === 0 && !inv.sentAt ? (
                <p className="text-muted-foreground">{t("noMails")}</p>
              ) : (
                activity.mails.map((m) => (
                  <div key={m.id} className="flex items-start justify-between gap-2">
                    <div>
                      <div>{m.to}</div>
                      <div className="text-xs text-muted-foreground">{m.subject}</div>
                      {m.error && <div className="text-xs text-red-600">{m.error}</div>}
                    </div>
                    <div className="shrink-0 text-xs text-muted-foreground">
                      {new Intl.DateTimeFormat(locale === "cs" ? "cs-CZ" : "en-GB", { dateStyle: "short", timeStyle: "short" }).format(m.sentAt)}
                    </div>
                  </div>
                ))
              )}
              {inv.proformaId && (
                <p className="text-muted-foreground">
                  <Link href={`/invoices/${inv.proformaId}`} className="underline">{t("fromProforma")}</Link>
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
