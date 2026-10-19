"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import type { Customer } from "@/db/schema";
import type { ActionResult } from "@/lib/validation";
import { COUNTRIES, countryByCode, splitPhone } from "@/lib/countries";
import { AresLookup } from "@/components/ares-lookup";
import { Field } from "@/components/form/field";
import { EmailField } from "@/components/form/email-field";
import { PhoneField } from "@/components/form/phone-field";
import { NativeSelect } from "@/components/form/native-select";
import { SubmitButton } from "@/components/form/submit-button";
import { Button } from "@/components/ui/button";
import { TextareaField } from "@/components/form/textarea-field";

type Props = {
  customer?: Customer;
  action: (fd: FormData) => Promise<ActionResult>;
  defaultCurrency: string;
  onCancel?: () => void;
  compact?: boolean;
};

export function CustomerForm({ customer, action, defaultCurrency, onCancel, compact }: Props) {
  const t = useTranslations("customers");
  const tc = useTranslations("common");
  const [ico, setIco] = useState(customer?.ico ?? "");
  const [name, setName] = useState(customer?.name ?? "");
  const [dic, setDic] = useState(customer?.dic ?? "");
  const [street, setStreet] = useState(customer?.street ?? "");
  const [city, setCity] = useState(customer?.city ?? "");
  const [zip, setZip] = useState(customer?.zip ?? "");
  const [country, setCountry] = useState(customer?.country ?? "CZ");
  const [language, setLanguage] = useState(customer?.language ?? "cs");
  const [currency, setCurrency] = useState(customer?.currency ?? defaultCurrency);
  const [phonePrefix, setPhonePrefix] = useState(() => splitPhone(customer?.phone, countryByCode(customer?.country).prefix).prefix);

  function changeCountry(code: string) {
    setCountry(code);
    const c = countryByCode(code);
    setPhonePrefix(c.prefix);
    if (!customer) {
      setLanguage(c.language);
      setCurrency(c.code === "CZ" ? defaultCurrency : c.currency);
    }
  }

  async function submit(fd: FormData) {
    const r = await action(fd);
    if (!r.ok) toast.error(r.error === "invalid" ? tc("invalid") : tc("error"));
  }

  return (
    <form action={submit} className="space-y-6">
      <section className="space-y-4">
        <AresLookup
          autoFocus={!customer}
          onSelect={(r) => {
            setIco(r.ico);
            setName(r.name);
            setDic(r.dic ?? "");
            setStreet(r.street ?? "");
            setCity(r.city ?? "");
            setZip(r.zip ?? "");
            changeCountry("CZ");
          }}
        />
        <Field label={t("name")} name="name" required value={name} onChange={(e) => setName(e.target.value)} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t("ico")} name="ico" inputMode="numeric" value={ico} onChange={(e) => setIco(e.target.value.replace(/\s/g, ""))} />
          <Field label={t("dic")} name="dic" value={dic} onChange={(e) => setDic(e.target.value.toUpperCase())} />
        </div>
      </section>
      <section className="space-y-4">
        <Field label={t("street")} name="street" value={street} onChange={(e) => setStreet(e.target.value)} />
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label={t("city")} name="city" value={city} onChange={(e) => setCity(e.target.value)} className="sm:col-span-2" />
          <Field label={t("zip")} name="zip" value={zip} onChange={(e) => setZip(e.target.value)} />
        </div>
        <NativeSelect label={t("country")} name="country" value={country} onChange={(e) => changeCountry(e.target.value)} options={COUNTRIES.map((c) => ({ value: c.code, label: c.name }))} />
      </section>
      <section className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <EmailField label={t("email")} name="email" defaultValue={customer?.email ?? ""} />
          <PhoneField label={t("phone")} name="phone" defaultValue={customer?.phone} prefix={phonePrefix} onPrefixChange={setPhonePrefix} />
        </div>
        <p className="text-xs text-muted-foreground">{t("emailHint")}</p>
        <div className="grid gap-4 sm:grid-cols-3">
          <NativeSelect
            label={t("language")}
            name="language"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            options={[
              { value: "cs", label: "Čeština" },
              { value: "en", label: "English" },
            ]}
          />
          <NativeSelect
            label={t("currency")}
            name="currency"
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            options={[
              { value: "CZK", label: "CZK" },
              { value: "EUR", label: "EUR" },
            ]}
          />
          <Field label={t("dueDays")} name="dueDays" type="number" min={0} max={365} defaultValue={customer?.dueDays ?? ""} placeholder={t("dueDaysDefault")} />
        </div>
        {!compact && (
          <TextareaField label={t("note")} name="note" rows={2} defaultValue={customer?.note ?? ""} placeholder={t("notePlaceholder")} />
        )}
      </section>
      <div className="flex items-center gap-2">
        <SubmitButton>{customer ? tc("save") : t("create")}</SubmitButton>
        {onCancel ? (
          <Button type="button" variant="ghost" onClick={onCancel}>{tc("cancel")}</Button>
        ) : (
          <Button type="button" variant="ghost" nativeButton={false} render={<Link href="/customers" />}>{tc("cancel")}</Button>
        )}
      </div>
    </form>
  );
}
