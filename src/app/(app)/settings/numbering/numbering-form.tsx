"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { updateNumberingAction } from "@/actions/company";
import { formatNumber, isValidPattern } from "@/lib/numbering";
import { Field } from "@/components/form/field";
import { SubmitButton } from "@/components/form/submit-button";

export function NumberingForm(props: { invoicePattern: string; proformaPattern: string }) {
  const t = useTranslations("numbering");
  const tc = useTranslations("common");
  const [invoice, setInvoice] = useState(props.invoicePattern);
  const [proforma, setProforma] = useState(props.proformaPattern);
  const now = new Date();

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

  return (
    <form action={submit} className="space-y-6">
      <p className="text-sm text-muted-foreground">{t("intro")}</p>
      <div className="space-y-1.5">
        <Field label={t("invoicePattern")} name="invoicePattern" value={invoice} onChange={(e) => setInvoice(e.target.value)} className="font-mono" />
        <p className="text-xs text-muted-foreground">{t("preview")}: {preview(invoice)}</p>
      </div>
      <div className="space-y-1.5">
        <Field label={t("proformaPattern")} name="proformaPattern" value={proforma} onChange={(e) => setProforma(e.target.value)} className="font-mono" />
        <p className="text-xs text-muted-foreground">{t("preview")}: {preview(proforma)}</p>
      </div>
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
