import { getTranslations } from "next-intl/server";
import { requireSession } from "@/lib/session";
import { getActiveCompany } from "@/lib/company";
import { AppShell, type NavItem } from "@/components/app-shell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();
  const active = await getActiveCompany();
  const t = await getTranslations("nav");
  const items: NavItem[] = active
    ? [
        { href: "/dashboard", label: t("dashboard"), icon: "dashboard" },
        { href: "/invoices", label: t("invoices"), icon: "invoices" },
        { href: "/customers", label: t("customers"), icon: "customers" },
        { href: "/recurring", label: t("recurring"), icon: "recurring" },
        { href: "/settings", label: t("settings"), icon: "settings" },
      ]
    : [];
  return (
    <AppShell user={session.user} companyName={active?.name ?? null} items={items}>
      {children}
    </AppShell>
  );
}
