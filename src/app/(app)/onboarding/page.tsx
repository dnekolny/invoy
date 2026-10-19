import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createCompanyAction } from "@/actions/company";
import { getActiveCompany } from "@/lib/company";
import { CompanyForm } from "@/components/company-form";
import { PageHeader, Panel } from "@/components/page-header";

export default async function OnboardingPage() {
  if (await getActiveCompany()) redirect("/dashboard");
  const t = await getTranslations("onboarding");
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title={t("title")} description={t("subtitle")} />
      <Panel className="p-6">
        <CompanyForm action={createCompanyAction} submitLabel={t("submit")} />
      </Panel>
    </div>
  );
}
