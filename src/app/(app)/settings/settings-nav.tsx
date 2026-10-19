"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export type SettingsItem = { href: string; label: string; description: string };

export function SettingsNav({ items }: { items: SettingsItem[] }) {
  const pathname = usePathname();
  return (
    <nav className="flex gap-1 overflow-x-auto md:flex-col">
      {items.map((i) => (
        <Link
          key={i.href}
          href={i.href}
          className={cn(
            "rounded-md px-3 py-1.5 text-sm whitespace-nowrap",
            pathname === i.href ? "bg-secondary font-medium" : "text-muted-foreground hover:bg-secondary/60"
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
    <div className="mb-6">
      <h2 className="text-lg font-semibold">{current.label}</h2>
      <p className="text-sm text-muted-foreground">{current.description}</p>
    </div>
  );
}
