"use client";

import type { RefObject } from "react";
import { cn } from "@/lib/utils";

type Props = {
  tokens: { value: string; label: string }[];
  targetRef: RefObject<HTMLInputElement | HTMLTextAreaElement | null>;
  value: string;
  onChange: (value: string) => void;
  className?: string;
};

export function InsertChips({ tokens, targetRef, value, onChange, className }: Props) {
  function insert(token: string) {
    const el = targetRef.current;
    const start = el?.selectionStart ?? value.length;
    const end = el?.selectionEnd ?? value.length;
    const next = value.slice(0, start) + token + value.slice(end);
    onChange(next);
    requestAnimationFrame(() => {
      if (!el) return;
      el.focus();
      const pos = start + token.length;
      el.setSelectionRange(pos, pos);
    });
  }
  return (
    <div className={cn("flex flex-wrap gap-1", className)}>
      {tokens.map((t) => (
        <button
          key={t.value}
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => insert(t.value)}
          title={t.label}
          className="rounded-md border bg-muted/60 px-2 py-0.5 font-mono text-xs hover:bg-muted"
        >
          {t.value}
          <span className="ml-1 font-sans text-muted-foreground">{t.label}</span>
        </button>
      ))}
    </div>
  );
}
