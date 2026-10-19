"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function IntroField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const t = useTranslations("invoiceEditor");
  const [open, setOpen] = useState(Boolean(value));
  if (!open) {
    return (
      <Button type="button" variant="ghost" size="sm" className="-ml-2 text-muted-foreground" onClick={() => setOpen(true)}>
        <Plus />
        {t("addIntro")}
      </Button>
    );
  }
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label htmlFor="intro">{t("intro")}</Label>
        <button
          type="button"
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          onClick={() => {
            onChange("");
            setOpen(false);
          }}
        >
          <X className="size-3" />
          {t("removeIntro")}
        </button>
      </div>
      <Textarea id="intro" rows={2} value={value} onChange={(e) => onChange(e.target.value)} placeholder={t("introPlaceholder")} autoFocus={!value} />
      <p className="text-xs text-muted-foreground">{t("introHint")}</p>
    </div>
  );
}
