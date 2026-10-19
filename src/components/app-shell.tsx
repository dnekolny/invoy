"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { FileText, LayoutDashboard, LogOut, Menu, Repeat, Search, Settings, Users, type LucideIcon } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ThemeToggle } from "@/components/theme-toggle";

export type NavItem = { href: string; label: string; icon: "dashboard" | "invoices" | "customers" | "recurring" | "settings" };
const ICONS: Record<NavItem["icon"], LucideIcon> = { dashboard: LayoutDashboard, invoices: FileText, customers: Users, recurring: Repeat, settings: Settings };

type Props = {
  user: { name: string; email: string; image?: string | null };
  companyName: string | null;
  items: NavItem[];
  children: ReactNode;
};

export function AppShell({ user, companyName, items, children }: Props) {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex min-h-screen">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r bg-sidebar p-4 lg:flex">
        <Sidebar user={user} companyName={companyName} items={items} />
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-sidebar px-4 lg:hidden">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger render={<Button variant="ghost" size="icon-sm" aria-label="Menu" />}>
              <Menu />
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-4">
              <SheetTitle className="sr-only">Menu</SheetTitle>
              <Sidebar user={user} companyName={companyName} items={items} onNavigate={() => setOpen(false)} />
            </SheetContent>
          </Sheet>
          <Logo />
          {companyName && <span className="truncate text-sm text-muted-foreground">{companyName}</span>}
        </header>
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}

function Logo() {
  return (
    <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
      <span className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <FileText className="size-4" />
      </span>
      Invoy
    </Link>
  );
}

function Sidebar({ user, companyName, items, onNavigate }: Omit<Props, "children"> & { onNavigate?: () => void }) {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const router = useRouter();
  const initials = (user.name || user.email).slice(0, 2).toUpperCase();

  async function signOut() {
    await authClient.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex items-center justify-between px-1">
        <Logo />
      </div>
      {companyName && <div className="truncate px-1 text-xs text-muted-foreground">{companyName}</div>}
      {items.length > 0 && (
        <form
          className="relative"
          onSubmit={(e) => {
            e.preventDefault();
            const q = (new FormData(e.currentTarget).get("q") as string).trim();
            router.push(q ? `/invoices?q=${encodeURIComponent(q)}` : "/invoices");
            onNavigate?.();
          }}
        >
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input name="q" placeholder={t("search")} className="h-9 bg-background pl-8" />
        </form>
      )}
      <nav className="flex flex-col gap-0.5">
        <p className="px-3 pb-1 text-[11px] font-medium tracking-wider text-muted-foreground uppercase">{t("menu")}</p>
        {items.map((i) => {
          const Icon = ICONS[i.icon];
          const active = pathname === i.href || pathname.startsWith(i.href + "/");
          return (
            <Link
              key={i.href}
              href={i.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                active ? "bg-sidebar-accent font-medium text-foreground ring-1 ring-border" : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
              )}
            >
              <Icon className="size-4" />
              {i.label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto flex flex-col gap-1">
        <ThemeToggle label={t("darkMode")} />
        <div className="flex items-center justify-between px-3 py-1 text-sm text-muted-foreground">
          <span>{t("language")}</span>
          <LanguageSwitcher />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger className="mt-1 flex w-full items-center gap-3 rounded-lg border bg-background p-2 text-left outline-none hover:bg-sidebar-accent focus-visible:ring-2 focus-visible:ring-ring">
            <Avatar className="size-8">
              <AvatarImage src={user.image ?? undefined} alt="" />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium">{user.name || user.email}</span>
              <span className="block truncate text-xs text-muted-foreground">{user.email}</span>
            </span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuGroup>
              <DropdownMenuLabel>
                <div className="text-sm font-medium">{user.name}</div>
                <div className="text-xs text-muted-foreground">{user.email}</div>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem render={<Link href="/settings" />}>
              <Settings />
              {t("settings")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={signOut}>
              <LogOut />
              {t("signOut")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
