"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import type { Company } from "@/db/schema";
import type { ActionResult } from "@/lib/validation";
import { AresLookup } from "@/components/ares-lookup";
import { Field } from "@/components/form/field";
import { NativeSelect } from "@/components/form/native-select";
import { CheckboxField } from "@/components/form/checkbox-field";
import { SubmitButton } from "@/components/form/submit-button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Props = { company?: Company; action: (fd: FormData) => Promise<ActionResult>; submitLabel: string };

export function CompanyForm({ company, action, submitLabel }: Props) {
  const t = useTranslations("company");
  const tc = useTranslations("common");
  const [ico, setIco] = useState(company?.ico ?? "");
  const [name, setName] = useState(company?.name ?? "");
  const [dic, setDic] = useState(company?.dic ?? "");
  const [street, setStreet] = useState(company?.street ?? "");
  const [city, setCity] = useState(company?.city ?? "");
  const [zip, setZip] = useState(company?.zip ?? "");
  const [vatPayer, setVatPayer] = useState(company?.vatPayer ?? false);

  async function submit(fd: FormData) {
    const r = await action(fd);
    if (!r.ok) toast.error(tc("error"));
    else toast.success(tc("saved"));
  }

  return (
    <form action={submit} className="space-y-6">
      <section className="space-y-4">
        <h2 className="text-base font-medium">{t("identity")}</h2>
        <AresLookup
          value={ico}
          onChange={setIco}
          onResult={(r) => {
            setIco(r.ico);
            setName(r.name);
            setDic(r.dic ?? "");
            setStreet(r.street ?? "");
            setCity(r.city ?? "");
            setZip(r.zip ?? "");
            setVatPayer(Boolean(r.dic));
          }}
        />
        <Field label={t("name")} name="name" required value={name} onChange={(e) => setName(e.target.value)} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t("dic")} name="dic" value={dic} onChange={(e) => setDic(e.target.value)} />
          <div className="flex items-end pb-2">
            <CheckboxField name="vatPayer" label={t("vatPayer")} checked={vatPayer} onChange={setVatPayer} />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-base font-medium">{t("address")}</h2>
        <Field label={t("street")} name="street" value={street} onChange={(e) => setStreet(e.target.value)} />
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label={t("city")} name="city" value={city} onChange={(e) => setCity(e.target.value)} className="sm:col-span-2" />
          <Field label={t("zip")} name="zip" value={zip} onChange={(e) => setZip(e.target.value)} />
        </div>
        <NativeSelect
          label={t("country")}
          name="country"
          defaultValue={company?.country ?? "CZ"}
          options={[
            { value: "CZ", label: "Česká republika" },
            { value: "SK", label: "Slovensko" },
            { value: "DE", label: "Deutschland" },
            { value: "AT", label: "Österreich" },
            { value: "PL", label: "Polska" },
          ]}
        />
      </section>

      <section className="space-y-4">
        <h2 className="text-base font-medium">{t("contact")}</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t("email")} name="email" type="email" defaultValue={company?.email ?? ""} />
          <Field label={t("phone")} name="phone" defaultValue={company?.phone ?? ""} />
        </div>
        <Field label={t("web")} name="web" defaultValue={company?.web ?? ""} />
      </section>

      <section className="space-y-4">
        <h2 className="text-base font-medium">{t("invoicing")}</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t("defaultDueDays")} name="defaultDueDays" type="number" min={0} max={365} defaultValue={company?.defaultDueDays ?? 14} />
          <NativeSelect
            label={t("defaultCurrency")}
            name="defaultCurrency"
            defaultValue={company?.defaultCurrency ?? "CZK"}
            options={[
              { value: "CZK", label: "CZK" },
              { value: "EUR", label: "EUR" },
            ]}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="registrationNote">{t("registrationNote")}</Label>
          <Textarea id="registrationNote" name="registrationNote" rows={2} defaultValue={company?.registrationNote ?? ""} placeholder={t("registrationNotePlaceholder")} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="footerText">{t("footerText")}</Label>
          <Textarea id="footerText" name="footerText" rows={2} defaultValue={company?.footerText ?? ""} />
        </div>
      </section>

      <SubmitButton>{submitLabel}</SubmitButton>
    </form>
  );
}
