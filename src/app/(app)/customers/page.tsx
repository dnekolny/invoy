import Link from "next/link";
import { and, asc, eq, ilike, inArray, or, sql } from "drizzle-orm";
import { getLocale, getTranslations } from "next-intl/server";
import { FilePlus2, Plus } from "lucide-react";
import { db } from "@/db";
import { customer, invoice } from "@/db/schema";
import { requireCompany } from "@/lib/company";
import { formatMoney } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LinkRow } from "@/components/link-row";
import { CustomerSearch } from "./customer-search";

export default async function CustomersPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const active = await requireCompany();
  const t = await getTranslations("customers");
  const locale = await getLocale();
  const conds = [eq(customer.companyId, active.id)];
  if (q) conds.push(or(ilike(customer.name, `%${q}%`), ilike(customer.ico, `%${q}%`), ilike(customer.email, `%${q}%`), ilike(customer.city, `%${q}%`))!);
  const rows = await db.select().from(customer).where(and(...conds)).orderBy(asc(customer.name));
  const stats = rows.length
    ? await db
        .select({
          customerId: invoice.customerId,
          currency: invoice.currency,
          count: sql<number>`count(*)`,
          unpaid: sql<string>`coalesce(sum(case when ${invoice.status} in ('issued','sent') then ${invoice.total} - ${invoice.paidAmount} else 0 end), 0)`,
        })
        .from(invoice)
        .where(and(eq(invoice.companyId, active.id), eq(invoice.type, "invoice"), inArray(invoice.status, ["issued", "sent", "paid"]), inArray(invoice.customerId, rows.map((r) => r.id))))
        .groupBy(invoice.customerId, invoice.currency)
    : [];
  const byCustomer = new Map<string, { count: number; unpaid: string[] }>();
  for (const s of stats) {
    if (!s.customerId) continue;
    const acc = byCustomer.get(s.customerId) ?? { count: 0, unpaid: [] };
    acc.count += Number(s.count);
    if (Number(s.unpaid) > 0) acc.unpaid.push(formatMoney(s.unpaid, s.currency, locale));
    byCustomer.set(s.customerId, acc);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
        <div className="flex items-center gap-2">
          <CustomerSearch q={q ?? ""} />
          <Button nativeButton={false} render={<Link href="/customers/new" />} size="sm">
            <Plus />
            {t("add")}
          </Button>
        </div>
      </div>
      {rows.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center">
          <p className="text-sm text-muted-foreground">{q ? t("emptySearch") : t("empty")}</p>
          {!q && (
            <Button className="mt-4" size="sm" nativeButton={false} render={<Link href="/customers/new" />}>
              <Plus />
              {t("add")}
            </Button>
          )}
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("name")}</TableHead>
              <TableHead>{t("ico")}</TableHead>
              <TableHead>{t("email")}</TableHead>
              <TableHead className="text-right">{t("invoicesCount")}</TableHead>
              <TableHead className="text-right">{t("unpaid")}</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => {
              const s = byCustomer.get(r.id);
              return (
                <LinkRow key={r.id} href={`/customers/${r.id}`}>
                  <TableCell>
                    <Link href={`/customers/${r.id}`} className="font-medium hover:underline">{r.name}</Link>
                    {r.city && <div className="text-xs text-muted-foreground">{r.city}</div>}
                  </TableCell>
                  <TableCell className="font-mono text-xs">{r.ico}</TableCell>
                  <TableCell className="max-w-56 truncate">{r.email || <span className="text-xs text-amber-700">{t("noEmail")}</span>}</TableCell>
                  <TableCell className="text-right tabular-nums">{s?.count ?? 0}</TableCell>
                  <TableCell className="text-right tabular-nums">{s?.unpaid.length ? <span className="font-medium">{s.unpaid.join(" + ")}</span> : <span className="text-muted-foreground">—</span>}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" nativeButton={false} render={<Link href={`/invoices/new?customer=${r.id}`} />} title={t("newInvoiceFor")}>
                      <FilePlus2 />
                      <span className="hidden sm:inline">{t("invoice")}</span>
                    </Button>
                  </TableCell>
                </LinkRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
