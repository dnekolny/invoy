import Link from "next/link";
import { asc, eq } from "drizzle-orm";
import { getTranslations } from "next-intl/server";
import { Plus } from "lucide-react";
import { db } from "@/db";
import { customer } from "@/db/schema";
import { requireCompany } from "@/lib/company";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default async function CustomersPage() {
  const active = await requireCompany();
  const t = await getTranslations("customers");
  const rows = await db.select().from(customer).where(eq(customer.companyId, active.id)).orderBy(asc(customer.name));
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
        <Button render={<Link href="/customers/new" />} size="sm">
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
              <TableHead>{t("ico")}</TableHead>
              <TableHead>{t("email")}</TableHead>
              <TableHead>{t("city")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">
                  <Link href={`/customers/${r.id}`} className="hover:underline">{r.name}</Link>
                </TableCell>
                <TableCell className="font-mono text-xs">{r.ico}</TableCell>
                <TableCell>{r.email}</TableCell>
                <TableCell>{r.city}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
