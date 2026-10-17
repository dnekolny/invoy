"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

type Props = { companyName: string | null; items: { href: string; label: string }[] };

export function MainNav({ companyName, items }: Props) {
  const pathname = usePathname();
  return (
    <nav className="flex items-center gap-5">
      <Link href="/dashboard" className="font-semibold">
        Invoy
        {companyName && <span className="ml-2 hidden font-normal text-muted-foreground sm:inline">· {companyName}</span>}
      </Link>
      {items.map((i) => (
        <Link
          key={i.href}
          href={i.href}
          className={cn(
            "text-sm",
            pathname === i.href || pathname.startsWith(i.href + "/") ? "font-medium" : "text-muted-foreground hover:text-foreground"
          )}
        >
          {i.label}
        </Link>
      ))}
    </nav>
  );
}
