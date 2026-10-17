import { asc, eq } from "drizzle-orm";
import { getTranslations } from "next-intl/server";
import { db } from "@/db";
import { bankAccount } from "@/db/schema";
import { deleteBankAccountAction } from "@/actions/bank-accounts";
import { requireCompany } from "@/lib/company";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ConfirmDelete } from "@/components/form/confirm-delete";
import { BankAccountDialog } from "./bank-account-dialog";

export default async function BankAccountsPage() {
  const active = await requireCompany();
  const t = await getTranslations("bank");
  const rows = await db.select().from(bankAccount).where(eq(bankAccount.companyId, active.id)).orderBy(asc(bankAccount.createdAt));
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{t("intro")}</p>
        <BankAccountDialog />
      </div>
      {rows.length === 0 ? (
        <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">{t("empty")}</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("label")}</TableHead>
              <TableHead>{t("number")}</TableHead>
              <TableHead>{t("currency")}</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">
                  {r.label} {r.isDefault && <Badge variant="secondary" className="ml-1">{t("default")}</Badge>}
                </TableCell>
                <TableCell className="font-mono text-xs">
                  {r.accountNumber ? `${r.accountNumber}/${r.bankCode}` : r.iban}
                </TableCell>
                <TableCell>{r.currency}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <BankAccountDialog account={r} />
                    <ConfirmDelete action={deleteBankAccountAction.bind(null, r.id)} title={t("deleteTitle")} />
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
