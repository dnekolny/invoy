import { getTranslations } from "next-intl/server";
import { saveCustomerAction } from "@/actions/customers";
import { requireCompany } from "@/lib/company";
import { CustomerForm } from "../customer-form";

export default async function NewCustomerPage() {
  const active = await requireCompany();
  const t = await getTranslations("customers");
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold">{t("newTitle")}</h1>
      <CustomerForm action={saveCustomerAction.bind(null, null)} defaultCurrency={active.defaultCurrency} />
    </div>
  );
}
