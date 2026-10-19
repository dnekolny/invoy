"use client";

import { useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { FieldShell, SHELL_INPUT } from "@/components/form/field-shell";
import { cn } from "@/lib/utils";

const DOMAINS = ["gmail.com", "seznam.cz", "email.cz", "centrum.cz", "outlook.com", "icloud.com", "post.cz", "volny.cz", "atlas.cz", "protonmail.com"];

type Props = {
  label: string;
  name: string;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  required?: boolean;
  className?: string;
  autoFocus?: boolean;
};

function split(v: string) {
  const i = v.indexOf("@");
  return i === -1 ? { local: v, domain: "" } : { local: v.slice(0, i), domain: v.slice(i + 1) };
}

export function EmailField({ label, name, value, defaultValue, onChange, required, className, autoFocus }: Props) {
  const controlled = value !== undefined;
  const [inner, setInner] = useState(defaultValue ?? "");
  const full = controlled ? value : inner;
  const { local, domain } = split(full);
  const domainRef = useRef<HTMLInputElement>(null);
  const localRef = useRef<HTMLInputElement>(null);
  const listId = `${name}-domains`;

  function set(l: string, d: string) {
    const next = l || d ? `${l}@${d}` : "";
    if (!controlled) setInner(next);
    onChange?.(next);
  }

  function changeLocal(v: string) {
    if (v.includes("@")) {
      const s = split(v.trim());
      set(s.local, s.domain || domain);
      requestAnimationFrame(() => domainRef.current?.select());
      return;
    }
    set(v.trim(), domain);
  }

  function changeDomain(v: string) {
    if (v.includes("@")) {
      const s = split(v.trim());
      set(s.local || local, s.domain);
      return;
    }
    set(local, v.trim());
  }

  const partial = Boolean(local || domain);
  return (
    <FieldShell label={label} htmlFor={`${name}-local`} required={required} className={className}>
      <div className="flex items-center">
        <Input
          ref={localRef}
          id={`${name}-local`}
          value={local}
          onChange={(e) => changeLocal(e.target.value)}
          required={required || partial}
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          autoFocus={autoFocus}
          placeholder="jmeno"
          className={cn(SHELL_INPUT, "min-w-0 flex-1 pr-1")}
          onKeyDown={(e) => {
            if (e.key === "@") {
              e.preventDefault();
              domainRef.current?.select();
            }
          }}
        />
        <span className="pt-2 text-sm text-muted-foreground select-none">@</span>
        <Input
          ref={domainRef}
          id={`${name}-domain`}
          value={domain}
          onChange={(e) => changeDomain(e.target.value)}
          required={required || partial}
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          list={listId}
          placeholder="domena.cz"
          pattern="[^@\s]+\.[^@\s]+"
          className={cn(SHELL_INPUT, "min-w-0 flex-[1.2] pl-1")}
          onKeyDown={(e) => {
            if (e.key === "Backspace" && domain === "") {
              e.preventDefault();
              localRef.current?.focus();
            }
          }}
        />
        <datalist id={listId}>
          {DOMAINS.map((d) => (
            <option key={d} value={d} />
          ))}
        </datalist>
      </div>
      <input type="hidden" name={name} value={full} />
    </FieldShell>
  );
}
