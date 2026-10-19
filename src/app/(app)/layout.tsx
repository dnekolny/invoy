import { getTranslations } from "next-intl/server";
import { requireSession } from "@/lib/session";
import { getActiveCompany } from "@/lib/company";
import { UserMenu } from "@/components/user-menu";
import { LanguageSwitcher } from "@/components/language-switcher";
import { MainNav } from "@/components/main-nav";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();
  const active = await getActiveCompany();
  const t = await getTranslations("nav");
  return (
    <>
      <header className="border-b">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
          <MainNav
            companyName={active?.name ?? null}
            items={
              active
                ? [
                    { href: "/dashboard", label: t("dashboard") },
                    { href: "/invoices", label: t("invoices") },
                    { href: "/customers", label: t("customers") },
                    { href: "/recurring", label: t("recurring") },
                    { href: "/settings", label: t("settings") },
                  ]
                : []
            }
          />
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <UserMenu user={session.user} />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8">{children}</main>
    </>
  );
}
