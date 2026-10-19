"use client";

import { useRouter } from "next/navigation";
import { TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

export function LinkRow({ href, className, children, ...props }: React.ComponentProps<typeof TableRow> & { href: string }) {
  const router = useRouter();
  return (
    <TableRow
      {...props}
      className={cn("cursor-pointer", className)}
      onClick={(e) => {
        const target = e.target as HTMLElement;
        if (target.closest("a, button, input, select, [role=menu]")) return;
        if (e.metaKey || e.ctrlKey) window.open(href, "_blank");
        else router.push(href);
      }}
      onMouseEnter={() => router.prefetch(href)}
    >
      {children}
    </TableRow>
  );
}
