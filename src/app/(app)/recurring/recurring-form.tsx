"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Play } from "lucide-react";
import { toast } from "sonner";
import { runRecurringNowAction, saveRecurringAction } from "@/actions/recurring";
import type { Company, Customer, Item, RecurringTemplate } from "@/db/schema";
import { advance, todayIso } from "@/lib/dates";
import { formatDate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/components/form/field";
import { NativeSelect } from "@/components/form/native-select";
import { CheckboxField } from "@/components/form/checkbox-field";
import { LinesEditor, newLine, type EditorLine } from "@/components/lines-editor";
import { IntroField } from "@/components/intro-field";

type Props = { company: Company; customers: Customer[]; items: Item[]; template?: RecurringTemplate };

export function RecurringForm({ company, customers, items, template }: Props) {
  const t = useTranslations("recurring");
  const tc = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const [pending, start] = useTransition();
  const [name, setName] = useState(template?.name ?? "");
  const [customerId, setCustomerId] = useState(template?.customerId ?? customers[0]?.id ?? "");
  const [type, setType] = useState(template?.type ?? "invoice");
  const [interval, setInterval] = useState(template?.interval ?? "monthly");
  const [nextDate, setNextDate] = useState(template?.nextDate ?? todayIso());
  const [dueDays, setDueDays] = useState(String(template?.dueDays ?? company.defaultDueDays));
  const [currency, setCurrency] = useState(template?.currency ?? company.defaultCurrency);
  const [intro, setIntro] = useState(template?.intro ?? "");
  const [note, setNote] = useState(template?.note ?? "");
  const [autoIssue, setAutoIssue] = useState(template?.autoIssue ?? true);
  const [autoSend, setAutoSend] = useState(template?.autoSend ?? false);
  const [active, setActive] = useState(template?.active ?? true);
  const [lines, setLines] = useState<EditorLine[]>(template?.lines.length ? template.lines.map((l) => newLine({ ...l })) : [newLine()]);

  function save() {
    const payload = {
      name, customerId, type, interval, nextDate, dueDays, currency, intro: intro.trim() || null, note: note.trim() || null, autoIssue, autoSend, active,
      lines: lines.filter((l) => l.name.trim()).map((l) => ({ name: l.name, quantity: l.quantity || "1", unit: l.unit || "ks", unitPrice: l.unitPrice || "0", vatRate: l.vatRate })),
    };
    if (!payload.customerId) {
      toast.error(t("needCustomer"));
      return;
    }
    if (payload.lines.length === 0) {
      toast.error(t("needLine"));
      return;
    }
    start(async () => {
      const r = await saveRecurringAction(template?.id ?? null, payload);
      if (!r.ok) {
        toast.error(tc("error"));
        return;
      }
      toast.success(tc("saved"));
      router.push("/recurring");
      router.refresh();
    });
  }

  function runNow() {
    if (!template) return;
    start(async () => {
      const r = await runRecurringNowAction(template.id);
      if (!r.ok) {
        toast.error(`${tc("error")} ${r.error}`);
        return;
      }
      toast.success(t("generated"));
      router.push(`/invoices/${r.invoiceId}`);
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-6">
        <Card>
          <CardHeader><CardTitle className="text-base">{t("basics")}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Field label={t("name")} name="name" value={name} onChange={(e) => setName(e.target.value)} placeholder={t("namePlaceholder")} required />
            <div className="space-y-1.5">
              <Label htmlFor="customerId">{t("customer")}</Label>
              <select id="customerId" className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm dark:bg-input/30" value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
                <option value="">{customers.length ? t("pickCustomer") : t("addCustomer")}</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              {customers.length === 0 && (
                <p className="text-xs text-muted-foreground"><Link href="/customers/new" className="underline">{t("addCustomer")}</Link></p>
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">{t("lines")}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <IntroField value={intro} onChange={setIntro} />
            <LinesEditor lines={lines} onChange={setLines} items={items} vatPayer={company.vatPayer} currency={currency} locale={locale} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">{t("note")}</CardTitle></CardHeader>
          <CardContent><Textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} /></CardContent>
        </Card>
      </div>
      <div className="space-y-6">
        <Card>
          <CardHeader><CardTitle className="text-base">{t("schedule")}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <NativeSelect label={t("interval")} name="interval" value={interval} onChange={(e) => setInterval(e.target.value)} options={["weekly", "monthly", "quarterly", "yearly"].map((v) => ({ value: v, label: t(`intervals.${v}`) }))} />
            <Field label={t("nextDate")} name="nextDate" type="date" value={nextDate} onChange={(e) => setNextDate(e.target.value)} />
            <div className="grid grid-cols-2 gap-3">
              <Field label={t("dueDays")} name="dueDays" type="number" min={0} value={dueDays} onChange={(e) => setDueDays(e.target.value)} />
              <NativeSelect label={t("currency")} name="currency" value={currency} onChange={(e) => setCurrency(e.target.value)} options={[{ value: "CZK", label: "CZK" }, { value: "EUR", label: "EUR" }]} />
            </div>
            <NativeSelect label={t("type")} name="type" value={type} onChange={(e) => setType(e.target.value as "invoice" | "proforma")} options={[{ value: "invoice", label: t("typeInvoice") }, { value: "proforma", label: t("typeProforma") }]} />
            <div className="space-y-2 pt-2">
              <CheckboxField name="autoIssue" label={t("autoIssue")} checked={autoIssue} onChange={(v) => { setAutoIssue(v); if (!v) setAutoSend(false); }} />
              <CheckboxField name="autoSend" label={t("autoSend")} checked={autoSend} onChange={setAutoSend} />
              <CheckboxField name="active" label={t("active")} checked={active} onChange={setActive} />
            </div>
            <p className="text-xs text-muted-foreground">{t("cronNote")}</p>
            {nextDate && (
              <p className="text-xs text-muted-foreground">
                {t("upcoming")}: {[0, 1, 2].reduce<string[]>((acc) => [...acc, acc.length ? advance(acc[acc.length - 1], interval) : nextDate], []).map((d) => formatDate(d, locale)).join(", ")}
              </p>
            )}
          </CardContent>
        </Card>
        <div className="flex flex-col gap-2">
          <Button onClick={save} disabled={pending}>{template ? tc("save") : t("create")}</Button>
          {template && (
            <Button variant="outline" onClick={runNow} disabled={pending}>
              <Play />
              {t("runNow")}
            </Button>
          )}
          <Button variant="ghost" nativeButton={false} render={<Link href="/recurring" />}>{tc("cancel")}</Button>
        </div>
      </div>
    </div>
  );
}
