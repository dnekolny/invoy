"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function SettingsNav({ items }: { items: { href: string; label: string }[] }) {
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
