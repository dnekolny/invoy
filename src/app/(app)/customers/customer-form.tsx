"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import type { Customer } from "@/db/schema";
import type { ActionResult } from "@/lib/validation";
import { AresLookup } from "@/components/ares-lookup";
import { Field } from "@/components/form/field";
import { NativeSelect } from "@/components/form/native-select";
import { SubmitButton } from "@/components/form/submit-button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Props = { customer?: Customer; action: (fd: FormData) => Promise<ActionResult>; defaultCurrency: string };

export function CustomerForm({ customer, action, defaultCurrency }: Props) {
  const t = useTranslations("customers");
  const tc = useTranslations("common");
  const [ico, setIco] = useState(customer?.ico ?? "");
  const [name, setName] = useState(customer?.name ?? "");
  const [dic, setDic] = useState(customer?.dic ?? "");
  const [street, setStreet] = useState(customer?.street ?? "");
  const [city, setCity] = useState(customer?.city ?? "");
  const [zip, setZip] = useState(customer?.zip ?? "");

  async function submit(fd: FormData) {
    const r = await action(fd);
    if (!r.ok) toast.error(tc("error"));
  }

  return (
    <form action={submit} className="space-y-6">
      <section className="space-y-4">
        <AresLookup
          onSelect={(r) => {
            setIco(r.ico);
            setName(r.name);
            setDic(r.dic ?? "");
            setStreet(r.street ?? "");
            setCity(r.city ?? "");
            setZip(r.zip ?? "");
          }}
        />
        <Field label={t("name")} name="name" required value={name} onChange={(e) => setName(e.target.value)} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t("ico")} name="ico" inputMode="numeric" value={ico} onChange={(e) => setIco(e.target.value)} />
          <Field label={t("dic")} name="dic" value={dic} onChange={(e) => setDic(e.target.value)} />
        </div>
      </section>
      <section className="space-y-4">
        <Field label={t("street")} name="street" value={street} onChange={(e) => setStreet(e.target.value)} />
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label={t("city")} name="city" value={city} onChange={(e) => setCity(e.target.value)} className="sm:col-span-2" />
          <Field label={t("zip")} name="zip" value={zip} onChange={(e) => setZip(e.target.value)} />
        </div>
        <NativeSelect
          label={t("country")}
          name="country"
          defaultValue={customer?.country ?? "CZ"}
          options={[
            { value: "CZ", label: "Česká republika" },
            { value: "SK", label: "Slovensko" },
            { value: "DE", label: "Deutschland" },
            { value: "AT", label: "Österreich" },
            { value: "PL", label: "Polska" },
            { value: "GB", label: "United Kingdom" },
            { value: "US", label: "United States" },
          ]}
        />
      </section>
      <section className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t("email")} name="email" type="email" defaultValue={customer?.email ?? ""} />
          <Field label={t("phone")} name="phone" defaultValue={customer?.phone ?? ""} />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <NativeSelect
            label={t("language")}
            name="language"
            defaultValue={customer?.language ?? "cs"}
            options={[
              { value: "cs", label: "Čeština" },
              { value: "en", label: "English" },
            ]}
          />
          <NativeSelect
            label={t("currency")}
            name="currency"
            defaultValue={customer?.currency ?? defaultCurrency}
            options={[
              { value: "CZK", label: "CZK" },
              { value: "EUR", label: "EUR" },
            ]}
          />
          <Field label={t("dueDays")} name="dueDays" type="number" min={0} max={365} defaultValue={customer?.dueDays ?? ""} placeholder={t("dueDaysDefault")} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="note">{t("note")}</Label>
          <Textarea id="note" name="note" rows={2} defaultValue={customer?.note ?? ""} />
        </div>
      </section>
      <SubmitButton>{tc("save")}</SubmitButton>
    </form>
  );
}
