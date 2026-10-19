"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { FieldShell, SHELL_INPUT } from "@/components/form/field-shell";
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
  return (
    <FieldShell label={label} htmlFor={`${name}-number`} className={className}>
      <div className="flex">
        <select aria-label="Předvolba" className="h-11 rounded-l-[inherit] border-r border-input bg-transparent pt-3 pb-1 pl-3 pr-1 text-sm outline-none" value={prefix} onChange={(e) => onPrefixChange(e.target.value)}>
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
          className={cn(SHELL_INPUT, "flex-1")}
        />
      </div>
      <input type="hidden" name={name} value={joinPhone(prefix, number)} />
    </FieldShell>
  );
}
