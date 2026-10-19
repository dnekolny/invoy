"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { updateNumberingAction } from "@/actions/company";
import { formatNumber, isValidPattern } from "@/lib/numbering";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InsertChips } from "@/components/form/insert-chips";
import { SubmitButton } from "@/components/form/submit-button";

const PRESETS = ["{YYYY}{NNN}", "{YYYY}-{NNN}", "{YY}{MM}{NN}", "F{YYYY}{NNNN}"];

export function NumberingForm(props: { invoicePattern: string; proformaPattern: string }) {
  const t = useTranslations("numbering");
  const tc = useTranslations("common");
  const [invoice, setInvoice] = useState(props.invoicePattern);
  const [proforma, setProforma] = useState(props.proformaPattern);
  const invoiceRef = useRef<HTMLInputElement>(null);
  const proformaRef = useRef<HTMLInputElement>(null);
  const now = new Date();
  const tokens = [
    { value: "{YYYY}", label: t("varYear") },
    { value: "{YY}", label: t("varYear2") },
    { value: "{MM}", label: t("varMonth") },
    { value: "{NNN}", label: t("varSeqShort") },
  ];

  async function submit(fd: FormData) {
    const r = await updateNumberingAction(fd);
    if (!r.ok) {
      toast.error(r.error === "pattern" ? t("invalidPattern") : tc("error"));
      return;
    }
    toast.success(tc("saved"));
  }

  function preview(p: string) {
    return isValidPattern(p) ? `${formatNumber(p, now, 1)}, ${formatNumber(p, now, 2)}, …` : t("invalidPattern");
  }

  function block(id: string, label: string, value: string, set: (v: string) => void, ref: React.RefObject<HTMLInputElement | null>, prefix: string) {
    return (
      <div className="space-y-2">
        <Label htmlFor={id}>{label}</Label>
        <Input ref={ref} id={id} name={id} value={value} onChange={(e) => set(e.target.value)} className="font-mono" autoComplete="off" />
        <InsertChips tokens={tokens} targetRef={ref} value={value} onChange={set} />
        <p className={`text-xs ${isValidPattern(value) ? "text-muted-foreground" : "text-red-600"}`}>
          {t("preview")}: {preview(value)}
        </p>
        <div className="flex flex-wrap gap-1 text-xs text-muted-foreground">
          {t("presets")}:
          {PRESETS.map((p) => (
            <button key={p} type="button" onClick={() => set(prefix + p)} className="font-mono underline-offset-2 hover:underline">
              {prefix + p}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <form action={submit} className="space-y-6">
      <p className="text-sm text-muted-foreground">{t("intro")}</p>
      {block("invoicePattern", t("invoicePattern"), invoice, setInvoice, invoiceRef, "")}
      {block("proformaPattern", t("proformaPattern"), proforma, setProforma, proformaRef, "Z")}
      <div className="rounded-lg bg-muted p-4 text-xs leading-relaxed">
        <p className="mb-1 font-medium">{t("variables")}</p>
        <p><code>{"{YYYY}"}</code> – {t("varYear")}, <code>{"{YY}"}</code> – {t("varYear2")}, <code>{"{MM}"}</code> – {t("varMonth")}</p>
        <p><code>{"{NNN}"}</code> – {t("varSeq")}</p>
        <p className="mt-1">{t("resetNote")}</p>
      </div>
      <SubmitButton>{tc("save")}</SubmitButton>
    </form>
  );
}
