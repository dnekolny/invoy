"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import type { InvoiceStatus } from "@/db/schema";

export type SelectableRow = { id: string; status: InvoiceStatus; hasEmail: boolean; payable: boolean };

type Ctx = { rows: SelectableRow[]; selected: Set<string>; toggle: (id: string, shift: boolean) => void; setAll: (on: boolean) => void; clear: () => void };

const SelectionContext = createContext<Ctx | null>(null);

export function SelectionProvider({ rows, children }: { rows: SelectableRow[]; children: React.ReactNode }) {
  const [raw, setRaw] = useState<Set<string>>(() => new Set());
  const last = useRef<string | null>(null);
  const ids = useMemo(() => rows.map((r) => r.id), [rows]);
  const selected = useMemo(() => new Set([...raw].filter((id) => ids.includes(id))), [raw, ids]);

  const toggle = useCallback(
    (id: string, shift: boolean) => {
      setRaw((prev) => {
        const next = new Set(prev);
        const on = !prev.has(id);
        const from = shift && last.current ? ids.indexOf(last.current) : -1;
        const to = ids.indexOf(id);
        if (from >= 0 && to >= 0) {
          for (let i = Math.min(from, to); i <= Math.max(from, to); i++) {
            if (on) next.add(ids[i]);
            else next.delete(ids[i]);
          }
        } else if (on) next.add(id);
        else next.delete(id);
        return next;
      });
      last.current = id;
    },
    [ids]
  );
  const setAll = useCallback((on: boolean) => setRaw(on ? new Set(ids) : new Set()), [ids]);
  const clear = useCallback(() => setRaw(new Set()), []);

  const value = useMemo(() => ({ rows, selected, toggle, setAll, clear }), [rows, selected, toggle, setAll, clear]);
  return <SelectionContext.Provider value={value}>{children}</SelectionContext.Provider>;
}

export function useSelection() {
  const ctx = useContext(SelectionContext);
  if (!ctx) throw new Error("SelectionProvider missing");
  return ctx;
}

export function RowCheckbox({ id }: { id: string }) {
  const t = useTranslations("invoices.bulk");
  const { selected, toggle } = useSelection();
  return (
    <input
      type="checkbox"
      className="size-4 accent-primary"
      checked={selected.has(id)}
      onChange={() => {}}
      onClick={(e) => toggle(id, e.shiftKey)}
      aria-label={t("selectRow")}
      data-select-row={id}
    />
  );
}

export function HeaderCheckbox() {
  const t = useTranslations("invoices.bulk");
  const { rows, selected, setAll } = useSelection();
  const all = rows.length > 0 && selected.size === rows.length;
  return (
    <input
      type="checkbox"
      className="size-4 accent-primary"
      checked={all}
      ref={(el) => {
        if (el) el.indeterminate = selected.size > 0 && !all;
      }}
      onChange={(e) => setAll(e.target.checked)}
      aria-label={t("selectAll")}
      data-select-all
    />
  );
}
