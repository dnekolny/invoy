"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";

export function CustomerSearch({ q }: { q: string }) {
  const t = useTranslations("customers");
  const router = useRouter();
  return (
    <form
      className="relative"
      onSubmit={(e) => {
        e.preventDefault();
        const v = (new FormData(e.currentTarget).get("q") as string).trim();
        router.push(v ? `/customers?q=${encodeURIComponent(v)}` : "/customers");
      }}
    >
      <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input name="q" key={q} defaultValue={q} placeholder={t("search")} className="w-48 pl-8 pr-8 sm:w-56" />
      {q && (
        <button type="button" onClick={() => router.push("/customers")} className="absolute top-1/2 right-2 -translate-y-1/2 text-muted-foreground hover:text-foreground" aria-label={t("clearSearch")}>
          <X className="size-4" />
        </button>
      )}
    </form>
  );
}
