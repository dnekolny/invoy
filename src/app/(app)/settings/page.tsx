import { getTranslations } from "next-intl/server";
import { updateCompanyAction } from "@/actions/company";
import { requireCompany } from "@/lib/company";
import { CompanyForm } from "@/components/company-form";

export default async function CompanySettingsPage() {
  const active = await requireCompany();
  const t = await getTranslations("common");
  return <CompanyForm company={active} action={updateCompanyAction} submitLabel={t("save")} />;
}
