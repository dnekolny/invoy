import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { requireSession } from "@/lib/session";
import { UserMenu } from "@/components/user-menu";
import { LanguageSwitcher } from "@/components/language-switcher";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();
  const t = await getTranslations("nav");
  return (
    <>
      <header className="border-b">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <nav className="flex items-center gap-6">
            <Link href="/dashboard" className="font-semibold">Invoy</Link>
            <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground">
              {t("dashboard")}
            </Link>
          </nav>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <UserMenu user={session.user} />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</main>
    </>
  );
}
