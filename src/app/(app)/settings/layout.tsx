import { getTranslations } from "next-intl/server";
import { requireCompany } from "@/lib/company";
import { SettingsHeading, SettingsNav, type SettingsItem } from "./settings-nav";
import { PageHeader, Panel } from "@/components/page-header";

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
    <div>
      <PageHeader title={t("title")} description={t("subtitle")} />
      <div className="grid gap-6 md:grid-cols-[220px_1fr]">
        <SettingsNav items={items} />
        <Panel className="min-w-0 p-6">
          <div className="max-w-2xl">
            <SettingsHeading items={items} />
            {children}
          </div>
        </Panel>
      </div>
    </div>
  );
}
