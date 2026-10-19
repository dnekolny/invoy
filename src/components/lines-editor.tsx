"use client";

import { useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Plus, Trash2 } from "lucide-react";
import Decimal from "decimal.js";
import type { Item } from "@/db/schema";
import { computeTotals } from "@/lib/money";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UnitsDatalist, UNITS_LIST_ID } from "@/components/form/units-datalist";

export type EditorLine = { key: string; name: string; quantity: string; unit: string; unitPrice: string; vatRate: number };

export function newLine(partial?: Partial<EditorLine>): EditorLine {
  return { key: Math.random().toString(36).slice(2), name: "", quantity: "1", unit: "ks", unitPrice: "", vatRate: 21, ...partial };
}

type Props = {
  lines: EditorLine[];
  onChange: (lines: EditorLine[]) => void;
  items: Item[];
  vatPayer: boolean;
  currency: string;
  locale: string;
};

export function LinesEditor({ lines, onChange, items, vatPayer, currency, locale }: Props) {
  const t = useTranslations("invoiceEditor");
  const [suggestFor, setSuggestFor] = useState<string | null>(null);
  const [highlight, setHighlight] = useState(0);
  const fmt = useMemo(() => new Intl.NumberFormat(locale === "cs" ? "cs-CZ" : "en-GB", { style: "currency", currency }), [locale, currency]);
  const container = useRef<HTMLDivElement>(null);

  function update(key: string, patch: Partial<EditorLine>) {
    onChange(lines.map((l) => (l.key === key ? { ...l, ...patch } : l)));
  }
  function remove(key: string) {
    onChange(lines.filter((l) => l.key !== key));
  }
  function move(from: number, to: number) {
    if (to < 0 || to >= lines.length) return;
    const copy = [...lines];
    const [l] = copy.splice(from, 1);
    copy.splice(to, 0, l);
    onChange(copy);
  }
  function applyItem(key: string, item: Item) {
    update(key, { name: item.name, unit: item.unit, unitPrice: trimNum(item.unitPrice), vatRate: item.vatRate });
    setSuggestFor(null);
    const idx = lines.findIndex((l) => l.key === key);
    requestAnimationFrame(() => {
      container.current?.querySelector<HTMLInputElement>(`[data-line="${idx}"][data-field="qty"]`)?.select();
    });
  }
  function addLine() {
    const line = newLine({ vatRate: lines.at(-1)?.vatRate ?? 21, unit: lines.at(-1)?.unit ?? "ks" });
    onChange([...lines, line]);
    const idx = lines.length;
    requestAnimationFrame(() => {
      container.current?.querySelector<HTMLInputElement>(`[data-line="${idx}"][data-field="name"]`)?.focus();
    });
  }

  const totals = computeTotals(
    lines.map((l) => ({ quantity: l.quantity.replace(",", ".") || 0, unitPrice: l.unitPrice.replace(",", ".") || 0, vatRate: l.vatRate })),
    vatPayer
  );

  return (
    <div className="space-y-3" ref={container}>
      <UnitsDatalist />
      <div className="hidden grid-cols-[16px_minmax(0,1fr)_64px_64px_96px_68px_96px_28px] gap-1.5 px-1 text-xs font-medium text-muted-foreground md:grid">
        <span />
        <span>{t("lineName")}</span>
        <span className="text-right">{t("qty")}</span>
        <span>{t("unit")}</span>
        <span className="text-right">{vatPayer ? t("unitPriceNet") : t("unitPrice")}</span>
        <span className="text-right">{vatPayer ? t("vat") : ""}</span>
        <span className="text-right">{t("lineTotal")}</span>
        <span />
      </div>
      {lines.map((l, idx) => {
        const net = new Decimal(l.quantity.replace(",", ".") || 0).mul(l.unitPrice.replace(",", ".") || 0);
        const q = fold(l.name);
        const suggestions = suggestFor === l.key ? (q ? items.filter((i) => fold(i.name).includes(q)) : items).slice(0, 6) : [];
        const isLast = idx === lines.length - 1;
        return (
          <div key={l.key} className="grid grid-cols-2 gap-2 rounded-lg border p-2 md:grid-cols-[16px_minmax(0,1fr)_64px_64px_96px_68px_96px_28px] md:gap-1.5 md:items-center md:border-0 md:p-0">
            <div className="hidden flex-col text-muted-foreground md:flex">
              <button type="button" className="h-3 leading-none hover:text-foreground disabled:opacity-30" onClick={() => move(idx, idx - 1)} aria-label="↑" disabled={idx === 0}>▴</button>
              <button type="button" className="h-3 leading-none hover:text-foreground disabled:opacity-30" onClick={() => move(idx, idx + 1)} aria-label="↓" disabled={isLast}>▾</button>
            </div>
            <div className="relative col-span-2 md:col-span-1">
              <Input
                data-line={idx}
                data-field="name"
                value={l.name}
                placeholder={items.length ? t("linePlaceholder") : t("linePlaceholderNoItems")}
                autoComplete="off"
                onChange={(e) => {
                  update(l.key, { name: e.target.value });
                  setSuggestFor(l.key);
                  setHighlight(0);
                }}
                onFocus={() => {
                  setSuggestFor(l.key);
                  setHighlight(0);
                }}
                onBlur={() => setTimeout(() => setSuggestFor((s) => (s === l.key ? null : s)), 150)}
                onKeyDown={(e) => {
                  if (!suggestions.length) return;
                  if (e.key === "ArrowDown") {
                    e.preventDefault();
                    setHighlight((h) => (h + 1) % suggestions.length);
                  } else if (e.key === "ArrowUp") {
                    e.preventDefault();
                    setHighlight((h) => (h - 1 + suggestions.length) % suggestions.length);
                  } else if (e.key === "Enter") {
                    e.preventDefault();
                    applyItem(l.key, suggestions[highlight] ?? suggestions[0]);
                  } else if (e.key === "Escape") {
                    setSuggestFor(null);
                  }
                }}
              />
              {suggestions.length > 0 && (
                <ul className="absolute top-full right-0 left-0 z-20 mt-1 overflow-hidden rounded-lg border bg-popover text-sm shadow-md">
                  {suggestions.map((i, si) => (
                    <li key={i.id}>
                      <button
                        type="button"
                        className={`flex w-full items-center justify-between px-3 py-1.5 text-left hover:bg-accent ${si === highlight ? "bg-accent" : ""}`}
                        onMouseDown={(e) => e.preventDefault()}
                        onMouseEnter={() => setHighlight(si)}
                        onClick={() => applyItem(l.key, i)}
                      >
                        <span>{i.name}</span>
                        <span className="text-xs text-muted-foreground">{fmt.format(Number(i.unitPrice))} / {i.unit}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <Input data-line={idx} data-field="qty" className="text-right" inputMode="decimal" value={l.quantity} onChange={(e) => update(l.key, { quantity: e.target.value })} onFocus={(e) => e.target.select()} aria-label={t("qty")} />
            <Input value={l.unit} list={UNITS_LIST_ID} autoComplete="off" onChange={(e) => update(l.key, { unit: e.target.value })} aria-label={t("unit")} />
            <Input
              className="text-right"
              inputMode="decimal"
              value={l.unitPrice}
              placeholder="0"
              onChange={(e) => update(l.key, { unitPrice: e.target.value })}
              onFocus={(e) => e.target.select()}
              onKeyDown={(e) => {
                if (e.key === "Enter" && isLast && !vatPayer) {
                  e.preventDefault();
                  addLine();
                }
              }}
              aria-label={t("unitPrice")}
            />
            {vatPayer ? (
              <select
                className="h-8 rounded-lg border border-input bg-transparent px-1 text-right text-sm dark:bg-input/30"
                value={l.vatRate}
                onChange={(e) => update(l.key, { vatRate: Number(e.target.value) })}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && isLast) {
                    e.preventDefault();
                    addLine();
                  }
                }}
                aria-label={t("vat")}
              >
                <option value={21}>21 %</option>
                <option value={12}>12 %</option>
                <option value={0}>0 %</option>
              </select>
            ) : (
              <span />
            )}
            <div className="text-right text-sm tabular-nums">{fmt.format(net.toNumber())}</div>
            <Button type="button" variant="ghost" size="icon-sm" onClick={() => remove(l.key)} aria-label={t("removeLine")} disabled={lines.length === 1}>
              <Trash2 />
            </Button>
          </div>
        );
      })}
      <div className="flex items-start justify-between gap-4 pt-1">
        <div className="space-y-1">
          <Button type="button" variant="outline" size="sm" onClick={addLine}>
            <Plus />
            {t("addLine")}
          </Button>
          <p className="hidden text-xs text-muted-foreground md:block">{t("enterHint")}</p>
        </div>
        <div className="space-y-1 text-right text-sm tabular-nums">
          {vatPayer && (
            <>
              <div className="text-muted-foreground">{t("subtotal")}: {fmt.format(totals.subtotal.toNumber())}</div>
              <div className="text-muted-foreground">{t("vatTotal")}: {fmt.format(totals.vatTotal.toNumber())}</div>
            </>
          )}
          <div className="text-base font-semibold">{t("total")}: {fmt.format(totals.total.toNumber())}</div>
        </div>
      </div>
    </div>
  );
}

function fold(v: string) {
  return v.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();
}

function trimNum(v: string) {
  return v.replace(/\.?0+$/, "").replace(/\.$/, "") || "0";
}
