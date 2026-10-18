"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Props = { filter: string; type: string; q: string; year?: number };

export function InvoiceFilters({ filter, type, q, year }: Props) {
  const t = useTranslations("invoices");
  const router = useRouter();
  const sp = useSearchParams();
  const thisYear = new Date().getFullYear();

  function set(patch: Record<string, string | undefined>) {
    const next = new URLSearchParams(sp.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (v) next.set(k, v);
      else next.delete(k);
    }
    router.push(`/invoices?${next.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex gap-1 rounded-lg bg-muted p-1">
        {["all", "unpaid", "overdue", "paid", "draft"].map((f) => (
          <Button key={f} size="sm" variant={filter === f ? "secondary" : "ghost"} className={filter === f ? "bg-background shadow-sm" : ""} onClick={() => set({ filter: f === "all" ? undefined : f })}>
            {t(`filter.${f}`)}
          </Button>
        ))}
      </div>
      <select className="h-8 rounded-lg border border-input bg-transparent px-2 text-sm dark:bg-input/30" value={type} onChange={(e) => set({ type: e.target.value === "all" ? undefined : e.target.value })}>
        <option value="all">{t("type.all")}</option>
        <option value="invoice">{t("type.invoice")}</option>
        <option value="proforma">{t("type.proforma")}</option>
      </select>
      <select className="h-8 rounded-lg border border-input bg-transparent px-2 text-sm dark:bg-input/30" value={year ?? ""} onChange={(e) => set({ year: e.target.value || undefined })}>
        <option value="">{t("allYears")}</option>
        {[thisYear, thisYear - 1, thisYear - 2].map((y) => (
          <option key={y} value={y}>{y}</option>
        ))}
      </select>
      <form
        className="relative ml-auto"
        onSubmit={(e) => {
          e.preventDefault();
          set({ q: (new FormData(e.currentTarget).get("q") as string) || undefined });
        }}
      >
        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input name="q" defaultValue={q} placeholder={t("search")} className="w-56 pl-8" />
      </form>
    </div>
  );
}
