import { getTranslations } from "next-intl/server";
import { saveCustomerAction } from "@/actions/customers";
import { requireCompany } from "@/lib/company";
import { CustomerForm } from "../customer-form";
import { PageHeader, Panel } from "@/components/page-header";

export default async function NewCustomerPage() {
  const active = await requireCompany();
  const t = await getTranslations("customers");
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader crumbs={[{ label: t("title"), href: "/customers" }, { label: t("newTitle") }]} title={t("newTitle")} description={t("newSubtitle")} />
      <Panel className="p-6">
        <CustomerForm action={saveCustomerAction.bind(null, null)} defaultCurrency={active.defaultCurrency} />
      </Panel>
    </div>
  );
}
