import Link from "next/link";
import { and, desc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { FilePlus2 } from "lucide-react";
import { db } from "@/db";
import { customer, invoice } from "@/db/schema";
import { deleteCustomerAction, saveCustomerAction } from "@/actions/customers";
import { requireCompany } from "@/lib/company";
import { formatDate, formatMoney } from "@/lib/format";
import { effectiveStatus } from "@/lib/invoices";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDelete } from "@/components/form/confirm-delete";
import { StatusBadge } from "@/components/status-badge";
import { CustomerForm } from "../customer-form";
import { PageHeader, Panel } from "@/components/page-header";

export default async function EditCustomerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const active = await requireCompany();
  const t = await getTranslations("customers");
  const locale = await getLocale();
  const [row] = await db.select().from(customer).where(and(eq(customer.id, id), eq(customer.companyId, active.id))).limit(1);
  if (!row) notFound();
  const invoices = await db.select().from(invoice).where(and(eq(invoice.companyId, active.id), eq(invoice.customerId, id))).orderBy(desc(invoice.issueDate), desc(invoice.createdAt)).limit(20);
  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        crumbs={[{ label: t("title"), href: "/customers" }, { label: row.name }]}
        title={row.name}
        description={[row.ico ? `IČO ${row.ico}` : null, row.city].filter(Boolean).join(" · ")}
        actions={
          <>
            <Button size="sm" nativeButton={false} render={<Link href={`/invoices/new?customer=${row.id}`} />}>
              <FilePlus2 />
              {t("newInvoiceFor")}
            </Button>
            <ConfirmDelete action={deleteCustomerAction.bind(null, row.id)} title={t("deleteTitle")} description={t("deleteDescription")} />
          </>
        }
      />
      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <Panel className="p-6">
          <CustomerForm customer={row} action={saveCustomerAction.bind(null, row.id)} defaultCurrency={active.defaultCurrency} />
        </Panel>
        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="text-base">{t("recentInvoices")}</CardTitle>
          </CardHeader>
          <CardContent>
            {invoices.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("noInvoicesYet")}</p>
            ) : (
              <ul className="divide-y text-sm">
                {invoices.map((i) => (
                  <li key={i.id} className="flex items-center justify-between gap-2 py-2">
                    <div className="min-w-0">
                      <Link href={`/invoices/${i.id}`} className="font-medium hover:underline">{i.number ?? t("draft")}</Link>
                      <div className="text-xs text-muted-foreground tabular-nums">{formatDate(i.issueDate, locale)}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={effectiveStatus(i)} />
                      <span className="tabular-nums">{formatMoney(i.total, i.currency, locale)}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
