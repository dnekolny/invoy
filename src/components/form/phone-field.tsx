"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { joinPhone, PHONE_PREFIXES, splitPhone } from "@/lib/countries";
import { cn } from "@/lib/utils";

type Props = {
  label: string;
  name: string;
  defaultValue?: string | null;
  prefix: string;
  onPrefixChange: (prefix: string) => void;
  className?: string;
};

export function PhoneField({ label, name, defaultValue, prefix, onPrefixChange, className }: Props) {
  const [number, setNumber] = useState(() => splitPhone(defaultValue, prefix).number);
  const selectClass = "h-8 rounded-lg border border-input bg-transparent px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30";
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={`${name}-number`}>{label}</Label>
      <div className="flex gap-1">
        <select aria-label="Předvolba" className={selectClass} value={prefix} onChange={(e) => onPrefixChange(e.target.value)}>
          {(PHONE_PREFIXES.includes(prefix) ? PHONE_PREFIXES : [prefix, ...PHONE_PREFIXES]).map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
        <Input
          id={`${name}-number`}
          inputMode="tel"
          autoComplete="tel-national"
          value={number}
          placeholder="777 123 456"
          onChange={(e) => {
            const v = e.target.value.trimStart();
            if (v.startsWith("+")) {
              const known = PHONE_PREFIXES.filter((p) => v.startsWith(p)).sort((a, b) => b.length - a.length)[0];
              if (known && v.length > known.length) {
                onPrefixChange(known);
                setNumber(v.slice(known.length).trim());
                return;
              }
            }
            setNumber(v);
          }}
          className="flex-1"
        />
      </div>
      <input type="hidden" name={name} value={joinPhone(prefix, number)} />
    </div>
  );
}
