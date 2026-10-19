import { getTranslations } from "next-intl/server";
import { requireCompany } from "@/lib/company";
import { SettingsHeading, SettingsNav, type SettingsItem } from "./settings-nav";

export default async function SettingsLayout({ children }: { children: React.ReactNode }) {
  await requireCompany();
  const t = await getTranslations("settings");
  const items: SettingsItem[] = [
    { href: "/settings", label: t("company"), description: t("companyDesc") },
    { href: "/settings/bank-accounts", label: t("bankAccounts"), description: t("bankAccountsDesc") },
    { href: "/settings/items", label: t("items"), description: t("itemsDesc") },
    { href: "/settings/numbering", label: t("numbering"), description: t("numberingDesc") },
    { href: "/settings/appearance", label: t("appearance"), description: t("appearanceDesc") },
    { href: "/settings/email", label: t("email"), description: t("emailDesc") },
  ];
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">{t("title")}</h1>
      <div className="grid gap-8 md:grid-cols-[200px_1fr]">
        <SettingsNav items={items} />
        <div className="min-w-0 max-w-2xl">
          <SettingsHeading items={items} />
          {children}
        </div>
      </div>
    </div>
  );
}
