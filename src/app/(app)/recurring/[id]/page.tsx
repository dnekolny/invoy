import { and, asc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { db } from "@/db";
import { item, recurringTemplate } from "@/db/schema";
import { deleteRecurringAction } from "@/actions/recurring";
import { requireCompany } from "@/lib/company";
import { companyCustomers } from "@/lib/invoices";
import { ConfirmDelete } from "@/components/form/confirm-delete";
import { RecurringForm } from "../recurring-form";
import { PageHeader } from "@/components/page-header";

export default async function EditRecurringPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const active = await requireCompany();
  const t = await getTranslations("recurring");
  const [tpl] = await db.select().from(recurringTemplate).where(and(eq(recurringTemplate.id, id), eq(recurringTemplate.companyId, active.id))).limit(1);
  if (!tpl) notFound();
  const [customers, items] = await Promise.all([companyCustomers(active.id), db.select().from(item).where(eq(item.companyId, active.id)).orderBy(asc(item.name))]);
  return (
    <div>
      <PageHeader crumbs={[{ label: t("title"), href: "/recurring" }, { label: tpl.name }]} title={tpl.name} actions={<ConfirmDelete action={deleteRecurringAction.bind(null, tpl.id)} title={t("deleteTitle")} />} />
      <RecurringForm company={active} customers={customers} items={items} template={tpl} />
    </div>
  );
}
