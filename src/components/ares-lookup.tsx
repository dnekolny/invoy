"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Search } from "lucide-react";
import { toast } from "sonner";
import { aresLookupAction } from "@/actions/ares";
import type { AresResult } from "@/lib/ares";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Props = { value: string; onChange: (v: string) => void; onResult: (r: AresResult) => void };

export function AresLookup({ value, onChange, onResult }: Props) {
  const t = useTranslations("ares");
  const [pending, start] = useTransition();
  const [touched, setTouched] = useState(false);

  function lookup() {
    setTouched(true);
    start(async () => {
      const r = await aresLookupAction(value);
      if (!r) {
        toast.error(t("notFound"));
        return;
      }
      onResult(r);
      toast.success(t("loaded"));
    });
  }

  return (
    <div className="space-y-1.5">
      <Label htmlFor="ico">{t("ico")}</Label>
      <div className="flex gap-2">
        <Input
          id="ico"
          name="ico"
          inputMode="numeric"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              lookup();
            }
          }}
        />
        <Button type="button" variant="outline" onClick={lookup} disabled={pending || value.replace(/\s/g, "").length !== 8}>
          <Search />
          {t("lookup")}
        </Button>
      </div>
      {touched && <p className="text-xs text-muted-foreground">{t("hint")}</p>}
    </div>
  );
}
