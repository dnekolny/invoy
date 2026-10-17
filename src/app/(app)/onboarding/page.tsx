import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createCompanyAction } from "@/actions/company";
import { getActiveCompany } from "@/lib/company";
import { CompanyForm } from "@/components/company-form";

export default async function OnboardingPage() {
  if (await getActiveCompany()) redirect("/dashboard");
  const t = await getTranslations("onboarding");
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>
      <CompanyForm action={createCompanyAction} submitLabel={t("submit")} />
    </div>
  );
}
