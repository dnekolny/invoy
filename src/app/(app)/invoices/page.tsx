import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { Plus } from "lucide-react";
import { requireCompany } from "@/lib/company";
import { daysOverdue } from "@/lib/dates";
import { formatDate, formatMoney } from "@/lib/format";
import { effectiveStatus, listInvoices, type InvoiceFilter } from "@/lib/invoices";
import type { InvoiceType } from "@/db/schema";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/status-badge";
import { LinkRow } from "@/components/link-row";
import { InvoiceFilters } from "./invoice-filters";
import { ExportMenu } from "./export-menu";

type Search = { filter?: string; type?: string; q?: string; year?: string };
const FILTERS: InvoiceFilter[] = ["all", "unpaid", "overdue", "paid", "draft"];

export default async function InvoicesPage({ searchParams }: { searchParams: Promise<Search> }) {
  const sp = await searchParams;
  const active = await requireCompany();
  const t = await getTranslations("invoices");
  const locale = await getLocale();
  const filter = (FILTERS.includes(sp.filter as InvoiceFilter) ? sp.filter : "all") as InvoiceFilter;
  const type = (["invoice", "proforma"].includes(sp.type ?? "") ? sp.type : "all") as InvoiceType | "all";
  const year = sp.year ? Number(sp.year) : undefined;
  const rows = await listInvoices(active.id, { filter, type, q: sp.q, year });
  const totals = rows.reduce(
    (acc, r) => {
      if (r.status !== "cancelled" && r.status !== "draft") acc[r.currency] = (acc[r.currency] ?? 0) + Number(r.total);
      return acc;
    },
    {} as Record<string, number>
  );
  const filtered = filter !== "all" || type !== "all" || Boolean(sp.q) || Boolean(year);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
        <div className="flex gap-2">
          <ExportMenu year={year} />
          <Button variant="outline" size="sm" nativeButton={false} render={<Link href="/invoices/new?type=proforma" />}>
            {t("newProforma")}
          </Button>
          <Button size="sm" nativeButton={false} render={<Link href="/invoices/new" />}>
            <Plus />
            {t("newInvoice")}
          </Button>
        </div>
      </div>
      <InvoiceFilters filter={filter} type={type} q={sp.q ?? ""} year={year} />
      {rows.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <p className="text-sm text-muted-foreground">{filtered ? t("emptyFiltered") : t("empty")}</p>
          {filtered ? (
            <Button className="mt-4" variant="outline" size="sm" nativeButton={false} render={<Link href="/invoices" />}>
              {t("clearFilters")}
            </Button>
          ) : (
            <Button className="mt-4" size="sm" nativeButton={false} render={<Link href="/invoices/new" />}>
              <Plus />
              {t("newInvoice")}
            </Button>
          )}
        </div>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("number")}</TableHead>
                <TableHead>{t("customer")}</TableHead>
                <TableHead>{t("issueDate")}</TableHead>
                <TableHead>{t("dueDate")}</TableHead>
                <TableHead>{t("status")}</TableHead>
                <TableHead className="text-right">{t("total")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => {
                const st = effectiveStatus(r);
                const overdueDays = st === "overdue" ? daysOverdue(r.dueDate) : 0;
                const remaining = Number(r.total) - Number(r.paidAmount);
                return (
                  <LinkRow key={r.id} href={`/invoices/${r.id}`}>
                    <TableCell>
                      <Link href={`/invoices/${r.id}`} className="font-medium hover:underline">
                        {r.number ?? <span className="text-muted-foreground">{t("draftNo")}</span>}
                      </Link>
                      {r.type === "proforma" && <span className="ml-2 text-xs text-muted-foreground">{t("proformaShort")}</span>}
                    </TableCell>
                    <TableCell className="max-w-64 truncate">{r.customerName || <span className="text-muted-foreground">—</span>}</TableCell>
                    <TableCell className="tabular-nums">{formatDate(r.issueDate, locale)}</TableCell>
                    <TableCell className="tabular-nums">
                      <span className={st === "overdue" ? "font-medium text-red-600" : ""}>{formatDate(r.dueDate, locale)}</span>
                      {overdueDays > 0 && <div className="text-xs text-red-600">{t("overdueDays", { n: overdueDays })}</div>}
                      {st === "paid" && r.paidAt && <div className="text-xs text-muted-foreground">{t("paidOn", { date: formatDate(r.paidAt, locale) })}</div>}
                    </TableCell>
                    <TableCell><StatusBadge status={st} /></TableCell>
                    <TableCell className="text-right font-medium tabular-nums">
                      {formatMoney(r.total, r.currency, locale)}
                      {(st === "issued" || st === "sent" || st === "overdue") && remaining > 0 && remaining < Number(r.total) && (
                        <div className="text-xs font-normal text-muted-foreground">{t("remaining", { amount: formatMoney(remaining, r.currency, locale) })}</div>
                      )}
                    </TableCell>
                  </LinkRow>
                );
              })}
            </TableBody>
          </Table>
          <p className="text-right text-sm text-muted-foreground">
            {t("countRows", { n: rows.length })} · {t("sum")}: {Object.entries(totals).map(([c, v]) => formatMoney(v, c, locale)).join(" + ") || "—"}
          </p>
        </>
      )}
    </div>
  );
}
