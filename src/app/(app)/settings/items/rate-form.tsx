"use client";

import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { saveRateAction } from "@/actions/items";
import { Field } from "@/components/form/field";
import { SubmitButton } from "@/components/form/submit-button";

export function RateForm(props: { mdRate: string | null; hoursPerDay: number; currency: string }) {
  const t = useTranslations("items.rate");
  const tc = useTranslations("common");

  async function submit(fd: FormData) {
    const r = await saveRateAction(fd);
    if (!r.ok) {
      toast.error(tc("error"));
      return;
    }
    toast.success(tc("saved"));
  }

  return (
    <form action={submit} className="rounded-lg border bg-muted/30 p-4">
      <h2 className="text-sm font-medium">{t("title")}</h2>
      <p className="mt-1 text-xs text-muted-foreground">{t("intro")}</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <Field label={`${t("mdRate")} (${props.currency})`} name="mdRate" inputMode="decimal" defaultValue={props.mdRate ? trimNum(props.mdRate) : ""} autoComplete="off" />
        <Field label={t("hoursPerDay")} name="hoursPerDay" type="number" min={1} max={24} defaultValue={props.hoursPerDay} />
        <SubmitButton variant="outline">{tc("save")}</SubmitButton>
      </div>
    </form>
  );
}

function trimNum(v: string) {
  return v.replace(/\.?0+$/, "").replace(/\.$/, "") || "0";
}
