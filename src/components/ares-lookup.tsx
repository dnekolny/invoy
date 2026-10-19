"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Search } from "lucide-react";
import { aresSearchAction } from "@/actions/ares";
import type { AresResult } from "@/lib/ares";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Props = { onSelect: (r: AresResult) => void; autoFocus?: boolean };

export function AresLookup({ onSelect, autoFocus }: Props) {
  const t = useTranslations("ares");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<AresResult[] | null>(null);
  const [pending, start] = useTransition();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => clearTimeout(timer.current ?? undefined), []);

  function change(value: string) {
    setQuery(value);
    if (timer.current) clearTimeout(timer.current);
    const q = value.trim();
    if (q.length < 3) {
      setResults(null);
      return;
    }
    timer.current = setTimeout(() => {
      start(async () => {
        setResults(await aresSearchAction(q));
      });
    }, 400);
  }

  function pick(r: AresResult) {
    onSelect(r);
    setQuery("");
    setResults(null);
  }

  return (
    <div className="space-y-1.5">
      <Label htmlFor="ares-query">{t("search")}</Label>
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          id="ares-query"
          className="h-10 bg-card pl-8"
          placeholder={t("placeholder")}
          autoComplete="off"
          autoFocus={autoFocus}
          value={query}
          onChange={(e) => change(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              if (results?.length === 1) pick(results[0]);
            }
          }}
        />
      </div>
      {query.trim().length >= 3 && (
        <div className="overflow-hidden rounded-lg border bg-popover text-sm shadow-sm">
          {pending && results === null ? (
            <p className="px-3 py-2 text-muted-foreground">{t("searching")}</p>
          ) : results && results.length === 0 ? (
            <p className="px-3 py-2 text-muted-foreground">{t("notFound")}</p>
          ) : (
            <ul className="max-h-64 divide-y overflow-y-auto">
              {results?.map((r) => (
                <li key={r.ico}>
                  <button
                    type="button"
                    onClick={() => pick(r)}
                    className="flex w-full flex-col items-start gap-0.5 px-3 py-2 text-left hover:bg-accent"
                  >
                    <span className="font-medium">{r.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {t("ico")} {r.ico}
                      {r.city ? ` · ${r.city}` : ""}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      <p className="text-xs text-muted-foreground">{t("hint")}</p>
    </div>
  );
}
