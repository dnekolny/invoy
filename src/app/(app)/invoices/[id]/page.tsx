import Link from "next/link";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { ArrowLeft, ExternalLink, FileDown, Pencil } from "lucide-react";
import Decimal from "decimal.js";
import { db } from "@/db";
import { emailChannel } from "@/db/schema";
import { requireCompany } from "@/lib/company";
import { daysOverdue } from "@/lib/dates";
import { formatDate, formatMoney } from "@/lib/format";
import { companyCounters } from "@/lib/invoice-number";
import { peekNumber } from "@/lib/invoice-number-peek";
import { effectiveStatus, getInvoiceActivity, getInvoiceWithLines } from "@/lib/invoices";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { CopyLink } from "./copy-link";
import { InvoiceActions } from "./invoice-actions";
import { PaymentsCard } from "./payments-card";
import { SendDialog } from "./send-dialog";

export default async function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const active = await requireCompany();
  const inv = await getInvoiceWithLines(active.id, id);
  if (!inv) notFound();
  const [t, locale, activity, [channel], counters] = await Promise.all([
    getTranslations("invoiceDetail"),
    getLocale(),
    getInvoiceActivity(id),
    db.select({ id: emailChannel.id, subjectTemplate: emailChannel.subjectTemplate, bodyTemplate: emailChannel.bodyTemplate }).from(emailChannel).where(eq(emailChannel.companyId, active.id)).limit(1),
    inv.status === "draft" ? companyCounters(active.id) : Promise.resolve({}),
  ]);
  const status = effectiveStatus(inv);
  const editable = inv.status !== "paid" && inv.status !== "cancelled";
  const publicUrl = `${process.env.BETTER_AUTH_URL}/i/${inv.publicToken}`;
  const remaining = new Decimal(inv.total).minus(inv.paidAmount);
  const dt = new Intl.DateTimeFormat(locale === "cs" ? "cs-CZ" : "en-GB", { dateStyle: "medium", timeStyle: "short" });
  const nextNumber = inv.status === "draft" ? peekNumber(counters, inv.type, inv.type === "proforma" ? active.proformaPattern : active.invoicePattern, inv.issueDate) : null;
  const overdueDays = status === "overdue" ? daysOverdue(inv.dueDate) : 0;

  const timeline: { label: string; at: Date | string | null; done: boolean }[] = [
    { label: t("timeline.created"), at: inv.createdAt, done: true },
    { label: t("timeline.issued"), at: inv.status === "draft" ? null : inv.issueDate, done: inv.status !== "draft" },
    { label: t("timeline.sent"), at: inv.sentAt, done: Boolean(inv.sentAt) },
    { label: t("timeline.viewed"), at: inv.viewedAt, done: Boolean(inv.viewedAt) },
    { label: inv.status === "cancelled" ? t("timeline.cancelled") : t("timeline.paid"), at: inv.paidAt, done: inv.status === "paid" || inv.status === "cancelled" },
  ];

  return (
    <div className="space-y-6">
      <Link href="/invoices" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-3.5" />
        {t("backToList")}
      </Link>
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
            {overdueDays > 0 && <span className="ml-1 font-medium text-red-600">({t("overdueDays", { n: overdueDays })})</span>}
          </p>
          {nextNumber && <p className="mt-1 text-xs text-muted-foreground">{t("nextNumber", { number: nextNumber })}</p>}
          {inv.status === "draft" && !inv.customerId && <p className="mt-1 text-xs text-amber-700">{t("needCustomer")}</p>}
        </div>
        <div className="flex flex-wrap gap-2">
          {editable && (
            <Button variant="outline" size="sm" nativeButton={false} render={<Link href={`/invoices/${inv.id}/edit`} />}>
              <Pencil />
              {t("edit")}
            </Button>
          )}
          <Button variant="outline" size="sm" nativeButton={false} render={<a href={`/api/invoices/${inv.id}/pdf`} />}>
            <FileDown />
            PDF
          </Button>
          {inv.status !== "draft" && inv.status !== "cancelled" && (
            <SendDialog
              invoiceId={inv.id}
              defaultTo={inv.customerEmail ?? ""}
              hasChannel={Boolean(channel)}
              alreadySent={Boolean(inv.sentAt)}
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
          <InvoiceActions invoice={{ id: inv.id, status: inv.status, type: inv.type, customerId: inv.customerId, proformaId: inv.proformaId, remaining: remaining.toFixed(2) }} />
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
              <CardContent className="space-y-3 text-sm">
                <p className="text-muted-foreground">{t("publicLinkHint")}</p>
                <div className="flex flex-wrap gap-2">
                  <CopyLink url={publicUrl} />
                  <Button variant="ghost" size="sm" nativeButton={false} render={<a href={publicUrl} target="_blank" rel="noreferrer" />}>
                    <ExternalLink />
                    {t("openLink")}
                  </Button>
                </div>
                <p className="text-muted-foreground">
                  {inv.viewedAt ? t("viewedAt", { date: dt.format(inv.viewedAt) }) : t("notViewed")}
                </p>
              </CardContent>
            </Card>
          )}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("timeline.title")}</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="space-y-2 text-sm">
                {timeline.map((e) => (
                  <li key={e.label} className="flex items-center gap-3">
                    <span className={`size-2.5 shrink-0 rounded-full ${e.done ? "bg-emerald-500" : "border border-muted-foreground/40"}`} />
                    <span className={e.done ? "" : "text-muted-foreground"}>{e.label}</span>
                    {e.at && <span className="ml-auto text-xs text-muted-foreground tabular-nums">{typeof e.at === "string" ? formatDate(e.at, locale) : dt.format(e.at)}</span>}
                  </li>
                ))}
              </ol>
              {inv.proformaId && (
                <p className="mt-3 text-sm text-muted-foreground">
                  <Link href={`/invoices/${inv.proformaId}`} className="underline">{t("fromProforma")}</Link>
                </p>
              )}
            </CardContent>
          </Card>
          {activity.mails.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t("history")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {activity.mails.map((m) => (
                  <div key={m.id} className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="truncate">{m.to}</div>
                      <div className="truncate text-xs text-muted-foreground">{m.subject}</div>
                      {m.error && <div className="text-xs text-red-600">{m.error}</div>}
                    </div>
                    <div className="shrink-0 text-xs text-muted-foreground">{dt.format(m.sentAt)}</div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
