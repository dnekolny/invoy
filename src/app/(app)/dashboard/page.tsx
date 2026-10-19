import Link from "next/link";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { getLocale, getTranslations } from "next-intl/server";
import { AlertTriangle, ArrowRight, CalendarDays, Plus, TrendingUp, Wallet } from "lucide-react";
import { db } from "@/db";
import { bankAccount, customer, emailChannel, invoice } from "@/db/schema";
import { requireCompany } from "@/lib/company";
import { todayIso } from "@/lib/dates";
import { formatDate, formatMoney } from "@/lib/format";
import { effectiveStatus } from "@/lib/invoices";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { PageHeader } from "@/components/page-header";

export default async function DashboardPage() {
  const active = await requireCompany();
  const t = await getTranslations("dashboard");
  const locale = await getLocale();
  const today = todayIso();
  const year = today.slice(0, 4);
  const month = today.slice(0, 7);

  const sumBy = (cond: ReturnType<typeof sql>) =>
    db
      .select({ currency: invoice.currency, total: sql<string>`coalesce(sum(${invoice.total} - ${invoice.paidAmount}), 0)`, count: sql<number>`count(*)` })
      .from(invoice)
      .where(and(eq(invoice.companyId, active.id), eq(invoice.type, "invoice"), cond))
      .groupBy(invoice.currency);

  const [unpaid, overdue, issuedYear, issuedMonth, recent, customersCount, banksCount, channels] = await Promise.all([
    sumBy(inArray(invoice.status, ["issued", "sent"])),
    sumBy(sql`${invoice.status} in ('issued','sent') and ${invoice.dueDate} < ${today}`),
    db.select({ currency: invoice.currency, total: sql<string>`coalesce(sum(${invoice.total}), 0)` }).from(invoice).where(and(eq(invoice.companyId, active.id), eq(invoice.type, "invoice"), inArray(invoice.status, ["issued", "sent", "paid"]), sql`to_char(${invoice.issueDate}, 'YYYY') = ${year}`)).groupBy(invoice.currency),
    db.select({ currency: invoice.currency, total: sql<string>`coalesce(sum(${invoice.total}), 0)` }).from(invoice).where(and(eq(invoice.companyId, active.id), eq(invoice.type, "invoice"), inArray(invoice.status, ["issued", "sent", "paid"]), sql`to_char(${invoice.issueDate}, 'YYYY-MM') = ${month}`)).groupBy(invoice.currency),
    db.select().from(invoice).where(eq(invoice.companyId, active.id)).orderBy(desc(invoice.createdAt)).limit(8),
    db.select({ n: sql<number>`count(*)` }).from(customer).where(eq(customer.companyId, active.id)),
    db.select({ n: sql<number>`count(*)` }).from(bankAccount).where(eq(bankAccount.companyId, active.id)),
    db.select({ n: sql<number>`count(*)` }).from(emailChannel).where(eq(emailChannel.companyId, active.id)),
  ]);

  const money = (rows: { currency: string; total: string }[]) =>
    rows.filter((r) => Number(r.total) !== 0).map((r) => formatMoney(r.total, r.currency, locale)).join(" + ") || formatMoney(0, active.defaultCurrency, locale);

  const checklist = [
    { done: Number(banksCount[0].n) > 0, label: t("setup.bank"), href: "/settings/bank-accounts" },
    { done: Number(customersCount[0].n) > 0, label: t("setup.customer"), href: "/customers/new" },
    { done: recent.length > 0, label: t("setup.invoice"), href: "/invoices/new" },
    { done: Number(channels[0].n) > 0, label: t("setup.email"), href: "/settings/email" },
  ];
  const showChecklist = checklist.some((c) => !c.done);

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        description={t("welcome", { name: active.name })}
        actions={
          <>
            <Button variant="outline" size="sm" nativeButton={false} render={<Link href="/customers/new" />}>
              {t("newCustomer")}
            </Button>
            <Button size="sm" nativeButton={false} render={<Link href="/invoices/new" />}>
              <Plus />
              {t("newInvoice")}
            </Button>
          </>
        }
      />

      {showChecklist && (
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-base">{t("setup.title")}</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="grid gap-2 sm:grid-cols-2">
              {checklist.map((c) => (
                <li key={c.href} className="flex items-center gap-2 text-sm">
                  <span className={`flex size-5 items-center justify-center rounded-full border text-xs ${c.done ? "border-emerald-500 bg-emerald-500 text-white" : "border-muted-foreground/40"}`}>{c.done ? "✓" : ""}</span>
                  {c.done ? <span className="text-muted-foreground line-through">{c.label}</span> : <Link href={c.href} className="underline-offset-2 hover:underline">{c.label}</Link>}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon={<Wallet className="size-4" />} title={t("unpaid")} value={money(unpaid)} hint={t("count", { n: unpaid.reduce((a, r) => a + Number(r.count), 0) })} href="/invoices?filter=unpaid" />
        <Stat icon={<AlertTriangle className="size-4" />} title={t("overdue")} value={money(overdue)} hint={t("count", { n: overdue.reduce((a, r) => a + Number(r.count), 0) })} href="/invoices?filter=overdue" danger={overdue.some((r) => Number(r.total) > 0)} />
        <Stat icon={<CalendarDays className="size-4" />} title={t("thisMonth")} value={money(issuedMonth)} href={`/invoices?year=${year}`} />
        <Stat icon={<TrendingUp className="size-4" />} title={t("thisYear", { year })} value={money(issuedYear)} href={`/invoices?year=${year}`} />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">{t("recent")}</CardTitle>
          <Link href="/invoices" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            {t("all")} <ArrowRight className="size-3.5" />
          </Link>
        </CardHeader>
        <CardContent>
          {recent.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("noInvoices")}</p>
          ) : (
            <ul className="divide-y">
              {recent.map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                  <div className="min-w-0">
                    <Link href={`/invoices/${r.id}`} className="font-medium hover:underline">{r.number ?? t("draft")}</Link>
                    <span className="ml-2 truncate text-muted-foreground">{r.customerName}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="hidden text-muted-foreground tabular-nums sm:inline">{formatDate(r.issueDate, locale)}</span>
                    <StatusBadge status={effectiveStatus(r)} />
                    <span className="w-28 text-right font-medium tabular-nums">{formatMoney(r.total, r.currency, locale)}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({ icon, title, value, hint, href, danger }: { icon: React.ReactNode; title: string; value: string; hint?: string; href: string; danger?: boolean }) {
  return (
    <Link href={href} className="block">
      <Card className="h-full transition-shadow hover:shadow-md">
        <CardContent className="flex items-start gap-3">
          <span className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${danger ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-200" : "bg-primary/10 text-primary"}`}>{icon}</span>
          <div className="min-w-0">
            <div className="text-xs font-medium text-muted-foreground">{title}</div>
            <div className={`truncate font-heading text-xl font-bold tabular-nums ${danger ? "text-red-600 dark:text-red-300" : ""}`}>{value}</div>
            {hint && <div className="text-xs text-muted-foreground">{hint}</div>}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
