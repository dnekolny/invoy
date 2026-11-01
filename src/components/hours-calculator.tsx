"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Clock } from "lucide-react";
import Decimal from "decimal.js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

type Props = {
  mdRate: string | null;
  hoursPerDay: number;
  fmt: Intl.NumberFormat;
  onApply: (r: { quantity: string; unit: string; unitPrice: string }) => void;
};

export function HoursCalculator({ mdRate, hoursPerDay, fmt, onApply }: Props) {
  const t = useTranslations("invoiceEditor.hours");
  const [open, setOpen] = useState(false);
  const [hours, setHours] = useState("");
  const [rate, setRate] = useState(mdRate ? trimNum(mdRate) : "");
  const [perDay, setPerDay] = useState(String(hoursPerDay));
  const [mode, setMode] = useState<"md" | "hours">("md");

  const h = num(hours);
  const r = num(rate);
  const d = num(perDay);
  const valid = h.gt(0) && r.gt(0) && d.gt(0);
  const days = valid ? h.div(d) : new Decimal(0);
  const total = valid ? days.mul(r) : new Decimal(0);

  function apply() {
    if (!valid) return;
    if (mode === "md") onApply({ quantity: trimNum(days.toFixed(3)), unit: "MD", unitPrice: trimNum(r.toFixed(2)) });
    else onApply({ quantity: trimNum(h.toFixed(2)), unit: "hod", unitPrice: trimNum(r.div(d).toFixed(2)) });
    setOpen(false);
    setHours("");
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger render={<Button type="button" variant="ghost" size="icon-sm" aria-label={t("open")} title={t("open")} />}>
        <Clock />
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 gap-3 p-3">
        <div className="text-sm font-medium">{t("title")}</div>
        <label className="block space-y-1 text-xs text-muted-foreground">
          <span>{t("hours")}</span>
          <Input
            inputMode="decimal"
            value={hours}
            autoFocus
            onChange={(e) => setHours(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                apply();
              }
            }}
            data-field="hours"
          />
        </label>
        <div className="grid grid-cols-2 gap-2">
          <label className="block space-y-1 text-xs text-muted-foreground">
            <span>{t("rate")}</span>
            <Input inputMode="decimal" value={rate} onChange={(e) => setRate(e.target.value)} />
          </label>
          <label className="block space-y-1 text-xs text-muted-foreground">
            <span>{t("perDay")}</span>
            <Input inputMode="numeric" value={perDay} onChange={(e) => setPerDay(e.target.value)} />
          </label>
        </div>
        <div className="flex gap-3 text-xs">
          <label className="flex cursor-pointer items-center gap-1.5"><input type="radio" name="hours-mode" checked={mode === "md"} onChange={() => setMode("md")} />{t("modeMd")}</label>
          <label className="flex cursor-pointer items-center gap-1.5"><input type="radio" name="hours-mode" checked={mode === "hours"} onChange={() => setMode("hours")} />{t("modeHours")}</label>
        </div>
        <div className="rounded-md bg-muted px-3 py-2 text-sm tabular-nums" data-field="hours-result">
          {valid ? (
            <>
              <div className="text-xs text-muted-foreground">{mode === "md" ? `${trimNum(days.toFixed(3))} MD × ${fmt.format(r.toNumber())}` : `${trimNum(h.toFixed(2))} hod × ${fmt.format(r.div(d).toNumber())}`}</div>
              <div className="font-semibold">{fmt.format(total.toNumber())}</div>
            </>
          ) : (
            <span className="text-xs text-muted-foreground">{t("empty")}</span>
          )}
        </div>
        <Button type="button" size="sm" onClick={apply} disabled={!valid}>
          {t("apply")}
        </Button>
      </PopoverContent>
    </Popover>
  );
}

function num(v: string) {
  const n = Number(v.replace(",", ".").trim());
  return new Decimal(Number.isFinite(n) ? n : 0);
}

function trimNum(v: string) {
  return v.replace(/\.?0+$/, "").replace(/\.$/, "") || "0";
}
