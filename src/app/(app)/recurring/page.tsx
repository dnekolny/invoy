import Link from "next/link";
import { asc, eq } from "drizzle-orm";
import { getLocale, getTranslations } from "next-intl/server";
import { Plus } from "lucide-react";
import { db } from "@/db";
import { customer, recurringTemplate } from "@/db/schema";
import { requireCompany } from "@/lib/company";
import { formatDate, formatMoney } from "@/lib/format";
import { computeTotals } from "@/lib/money";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default async function RecurringPage() {
  const active = await requireCompany();
  const t = await getTranslations("recurring");
  const locale = await getLocale();
  const rows = await db
    .select({ tpl: recurringTemplate, customerName: customer.name })
    .from(recurringTemplate)
    .innerJoin(customer, eq(customer.id, recurringTemplate.customerId))
    .where(eq(recurringTemplate.companyId, active.id))
    .orderBy(asc(recurringTemplate.nextDate));
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{t("title")}</h1>
          <p className="text-sm text-muted-foreground">{t("intro")}</p>
        </div>
        <Button size="sm" render={<Link href="/recurring/new" />}>
          <Plus />
          {t("add")}
        </Button>
      </div>
      {rows.length === 0 ? (
        <p className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">{t("empty")}</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("name")}</TableHead>
              <TableHead>{t("customer")}</TableHead>
              <TableHead>{t("interval")}</TableHead>
              <TableHead>{t("nextDate")}</TableHead>
              <TableHead className="text-right">{t("amount")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map(({ tpl, customerName }) => {
              const total = computeTotals(tpl.lines, active.vatPayer).total;
              return (
                <TableRow key={tpl.id}>
                  <TableCell>
                    <Link href={`/recurring/${tpl.id}`} className="font-medium hover:underline">{tpl.name}</Link>
                    {!tpl.active && <Badge variant="secondary" className="ml-2">{t("paused")}</Badge>}
                  </TableCell>
                  <TableCell>{customerName}</TableCell>
                  <TableCell>{t(`intervals.${tpl.interval}`)}</TableCell>
                  <TableCell className="tabular-nums">{formatDate(tpl.nextDate, locale)}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatMoney(total.toNumber(), tpl.currency, locale)}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
