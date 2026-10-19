"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import type { Company } from "@/db/schema";
import type { ActionResult } from "@/lib/validation";
import { COUNTRIES, countryByCode, splitPhone } from "@/lib/countries";
import { AresLookup } from "@/components/ares-lookup";
import { Field } from "@/components/form/field";
import { EmailField } from "@/components/form/email-field";
import { PhoneField } from "@/components/form/phone-field";
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
  const [country, setCountry] = useState(company?.country ?? "CZ");
  const [vatPayer, setVatPayer] = useState(company?.vatPayer ?? false);
  const [phonePrefix, setPhonePrefix] = useState(() => splitPhone(company?.phone, countryByCode(company?.country).prefix).prefix);
  const [registrationNote, setRegistrationNote] = useState(company?.registrationNote ?? "");

  function changeCountry(code: string) {
    setCountry(code);
    setPhonePrefix(countryByCode(code).prefix);
  }

  function toggleVat(v: boolean) {
    setVatPayer(v);
    if (v && !dic && ico && country === "CZ") setDic(`CZ${ico}`);
  }

  async function submit(fd: FormData) {
    const r = await action(fd);
    if (!r.ok) toast.error(r.error === "invalid" ? tc("invalid") : tc("error"));
    else toast.success(tc("saved"));
  }

  return (
    <form action={submit} className="space-y-6">
      <section className="space-y-4">
        <h2 className="text-base font-medium">{t("identity")}</h2>
        <AresLookup
          onSelect={(r) => {
            setIco(r.ico);
            setName(r.name);
            setDic(r.dic ?? "");
            setStreet(r.street ?? "");
            setCity(r.city ?? "");
            setZip(r.zip ?? "");
            setVatPayer(Boolean(r.dic));
            changeCountry("CZ");
          }}
        />
        <Field label={t("name")} name="name" required value={name} onChange={(e) => setName(e.target.value)} />
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label={t("ico")} name="ico" inputMode="numeric" value={ico} onChange={(e) => setIco(e.target.value.replace(/\s/g, ""))} />
          <Field label={t("dic")} name="dic" value={dic} onChange={(e) => setDic(e.target.value.toUpperCase())} placeholder={vatPayer ? "CZ12345678" : undefined} />
          <div className="flex items-end pb-2">
            <CheckboxField name="vatPayer" label={t("vatPayer")} checked={vatPayer} onChange={toggleVat} />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-base font-medium">{t("address")}</h2>
        <Field label={t("street")} name="street" value={street} onChange={(e) => setStreet(e.target.value)} autoComplete="street-address" />
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label={t("city")} name="city" value={city} onChange={(e) => setCity(e.target.value)} className="sm:col-span-2" autoComplete="address-level2" />
          <Field label={t("zip")} name="zip" value={zip} onChange={(e) => setZip(e.target.value)} autoComplete="postal-code" />
        </div>
        <NativeSelect label={t("country")} name="country" value={country} onChange={(e) => changeCountry(e.target.value)} options={COUNTRIES.map((c) => ({ value: c.code, label: c.name }))} />
      </section>

      <section className="space-y-4">
        <h2 className="text-base font-medium">{t("contact")}</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <EmailField label={t("email")} name="email" defaultValue={company?.email ?? ""} />
          <PhoneField label={t("phone")} name="phone" defaultValue={company?.phone} prefix={phonePrefix} onPrefixChange={setPhonePrefix} />
        </div>
        <Field label={t("web")} name="web" defaultValue={company?.web ?? ""} placeholder="www.firma.cz" autoComplete="url" />
        <p className="text-xs text-muted-foreground">{t("contactHint")}</p>
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
          <Textarea id="registrationNote" name="registrationNote" rows={2} value={registrationNote} onChange={(e) => setRegistrationNote(e.target.value)} placeholder={t("registrationNotePlaceholder")} />
          <div className="flex flex-wrap gap-1">
            {[t("regPresetTrade"), t("regPresetCommercial")].map((p) => (
              <button key={p} type="button" onClick={() => setRegistrationNote(p)} className="rounded-md border bg-muted/60 px-2 py-0.5 text-xs hover:bg-muted">
                {p}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">{t("registrationNoteHint")}</p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="footerText">{t("footerText")}</Label>
          <Textarea id="footerText" name="footerText" rows={2} defaultValue={company?.footerText ?? ""} placeholder={t("footerPlaceholder")} />
        </div>
      </section>

      <SubmitButton>{submitLabel}</SubmitButton>
    </form>
  );
}
