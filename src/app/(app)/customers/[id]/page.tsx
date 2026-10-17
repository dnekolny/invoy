import { and, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { db } from "@/db";
import { customer } from "@/db/schema";
import { deleteCustomerAction, saveCustomerAction } from "@/actions/customers";
import { requireCompany } from "@/lib/company";
import { ConfirmDelete } from "@/components/form/confirm-delete";
import { CustomerForm } from "../customer-form";

export default async function EditCustomerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const active = await requireCompany();
  const t = await getTranslations("customers");
  const [row] = await db.select().from(customer).where(and(eq(customer.id, id), eq(customer.companyId, active.id))).limit(1);
  if (!row) notFound();
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{row.name}</h1>
        <ConfirmDelete action={deleteCustomerAction.bind(null, row.id)} title={t("deleteTitle")} description={t("deleteDescription")} />
      </div>
      <CustomerForm customer={row} action={saveCustomerAction.bind(null, row.id)} defaultCurrency={active.defaultCurrency} />
    </div>
  );
}
