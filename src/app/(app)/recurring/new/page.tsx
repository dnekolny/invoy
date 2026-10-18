import { asc, eq } from "drizzle-orm";
import { getTranslations } from "next-intl/server";
import { db } from "@/db";
import { item } from "@/db/schema";
import { requireCompany } from "@/lib/company";
import { companyCustomers } from "@/lib/invoices";
import { RecurringForm } from "../recurring-form";

export default async function NewRecurringPage() {
  const active = await requireCompany();
  const t = await getTranslations("recurring");
  const [customers, items] = await Promise.all([companyCustomers(active.id), db.select().from(item).where(eq(item.companyId, active.id)).orderBy(asc(item.name))]);
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">{t("newTitle")}</h1>
      <RecurringForm company={active} customers={customers} items={items} />
    </div>
  );
}
