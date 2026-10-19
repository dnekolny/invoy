"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export type SettingsItem = { href: string; label: string; description: string };

export function SettingsNav({ items }: { items: SettingsItem[] }) {
  const pathname = usePathname();
  return (
    <nav className="flex gap-1 overflow-x-auto rounded-xl border bg-card p-2 md:flex-col md:self-start">
      {items.map((i) => (
        <Link
          key={i.href}
          href={i.href}
          className={cn(
            "rounded-lg px-3 py-2 text-sm whitespace-nowrap",
            pathname === i.href ? "bg-accent font-medium" : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
          )}
        >
          {i.label}
        </Link>
      ))}
    </nav>
  );
}

export function SettingsHeading({ items }: { items: SettingsItem[] }) {
  const pathname = usePathname();
  const current = items.find((i) => i.href === pathname);
  if (!current) return null;
  return (
    <div className="mb-6 border-b pb-4">
      <h2 className="text-lg font-semibold">{current.label}</h2>
      <p className="text-sm text-muted-foreground">{current.description}</p>
    </div>
  );
}
