import { getTranslations } from "next-intl/server";
import { requireCompany } from "@/lib/company";
import { SettingsNav } from "./settings-nav";

export default async function SettingsLayout({ children }: { children: React.ReactNode }) {
  await requireCompany();
  const t = await getTranslations("settings");
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">{t("title")}</h1>
      <div className="grid gap-8 md:grid-cols-[200px_1fr]">
        <SettingsNav
          items={[
            { href: "/settings", label: t("company") },
            { href: "/settings/bank-accounts", label: t("bankAccounts") },
            { href: "/settings/items", label: t("items") },
            { href: "/settings/numbering", label: t("numbering") },
          ]}
        />
        <div className="min-w-0 max-w-2xl">{children}</div>
      </div>
    </div>
  );
}
