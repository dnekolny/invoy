import { asc, eq } from "drizzle-orm";
import { getLocale, getTranslations } from "next-intl/server";
import { db } from "@/db";
import { item } from "@/db/schema";
import { deleteItemAction } from "@/actions/items";
import { requireCompany } from "@/lib/company";
import { formatMoney } from "@/lib/format";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ConfirmDelete } from "@/components/form/confirm-delete";
import { ItemDialog } from "./item-dialog";

export default async function ItemsPage() {
  const active = await requireCompany();
  const t = await getTranslations("items");
  const locale = await getLocale();
  const rows = await db.select().from(item).where(eq(item.companyId, active.id)).orderBy(asc(item.name));
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{t("intro")}</p>
        <ItemDialog vatPayer={active.vatPayer} />
      </div>
      {rows.length === 0 ? (
        <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">{t("empty")}</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("name")}</TableHead>
              <TableHead>{t("unit")}</TableHead>
              <TableHead className="text-right">{t("unitPrice")}</TableHead>
              {active.vatPayer && <TableHead className="text-right">{t("vatRate")}</TableHead>}
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell>
                  <div className="font-medium">{r.name}</div>
                  {r.description && <div className="text-xs text-muted-foreground">{r.description}</div>}
                </TableCell>
                <TableCell>{r.unit}</TableCell>
                <TableCell className="text-right tabular-nums">{formatMoney(r.unitPrice, active.defaultCurrency, locale)}</TableCell>
                {active.vatPayer && <TableCell className="text-right">{r.vatRate} %</TableCell>}
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <ItemDialog item={r} vatPayer={active.vatPayer} />
                    <ConfirmDelete action={deleteItemAction.bind(null, r.id)} title={t("deleteTitle")} />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
