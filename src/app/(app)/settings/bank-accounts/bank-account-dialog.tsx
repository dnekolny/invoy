"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Pencil, Plus } from "lucide-react";
import { toast } from "sonner";
import { saveBankAccountAction } from "@/actions/bank-accounts";
import type { BankAccount } from "@/db/schema";
import { czechIban } from "@/lib/bank";
import { bankByCode, CZ_BANKS } from "@/lib/banks";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Field } from "@/components/form/field";
import { NativeSelect } from "@/components/form/native-select";
import { CheckboxField } from "@/components/form/checkbox-field";
import { SubmitButton } from "@/components/form/submit-button";

const OTHER = "other";

function formatIban(iban: string) {
  return iban.replace(/(.{4})/g, "$1 ").trim();
}

export function BankAccountDialog({ account, isFirst }: { account?: BankAccount; isFirst?: boolean }) {
  const t = useTranslations("bank");
  const tc = useTranslations("common");
  const [open, setOpen] = useState(false);
  const known = bankByCode(account?.bankCode);
  const [bank, setBank] = useState(account ? (known ? known.code : OTHER) : "");
  const [accountNumber, setAccountNumber] = useState(account?.accountNumber ?? "");
  const [bankCode, setBankCode] = useState(account?.bankCode ?? "");
  const [swift, setSwift] = useState(account?.swift ?? "");
  const [iban, setIban] = useState(account?.iban ?? "");
  const [currency, setCurrency] = useState(account?.currency ?? "CZK");
  const [label, setLabel] = useState(account?.label ?? "");
  const [labelTouched, setLabelTouched] = useState(Boolean(account));

  const computedIban = !iban && accountNumber && bankCode ? czechIban(accountNumber, bankCode) : null;
  const ibanShown = iban ? iban.replace(/\s/g, "").toUpperCase() : computedIban;

  function chooseBank(code: string) {
    setBank(code);
    const b = bankByCode(code);
    if (b) {
      setBankCode(b.code);
      setSwift(b.swift);
      if (!labelTouched) setLabel(`${b.name} ${currency}`);
    } else if (code === OTHER) {
      setBankCode("");
      setSwift("");
    }
  }

  function changeCurrency(c: string) {
    setCurrency(c);
    const b = bankByCode(bank);
    if (b && !labelTouched) setLabel(`${b.name} ${c}`);
  }

  async function submit(fd: FormData) {
    const r = await saveBankAccountAction(account?.id ?? null, fd);
    if (!r.ok) {
      toast.error(r.error === "invalid" ? tc("invalid") : tc("error"));
      return;
    }
    toast.success(tc("saved"));
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={account ? <Button variant="ghost" size="icon-sm" aria-label={tc("edit")} /> : <Button size="sm" />}
      >
        {account ? <Pencil /> : <><Plus />{t("add")}</>}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{account ? t("editTitle") : t("addTitle")}</DialogTitle>
          <DialogDescription>{t("dialogHint")}</DialogDescription>
        </DialogHeader>
        <form action={submit} className="space-y-4">
          <NativeSelect
            label={t("bank")}
            name="bank"
            value={bank}
            onChange={(e) => chooseBank(e.target.value)}
            options={[
              { value: "", label: t("pickBank") },
              ...CZ_BANKS.map((b) => ({ value: b.code, label: `${b.name} (${b.code})` })),
              { value: OTHER, label: t("otherBank") },
            ]}
          />
          <div className="grid grid-cols-[1fr_110px] gap-3">
            <Field
              label={t("accountNumber")}
              name="accountNumber"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value.replace(/[^\d-]/g, ""))}
              inputMode="numeric"
              placeholder="123456-1234567890"
              autoComplete="off"
            />
            <Field
              label={t("bankCode")}
              name="bankCode"
              value={bankCode}
              onChange={(e) => setBankCode(e.target.value.replace(/\D/g, "").slice(0, 4))}
              inputMode="numeric"
              readOnly={bank !== OTHER && bank !== ""}
              maxLength={4}
            />
          </div>
          {ibanShown && (
            <p className="text-xs text-muted-foreground">
              IBAN: <span className="font-mono text-foreground">{formatIban(ibanShown)}</span>
              {!iban && <span className="ml-1">({t("ibanAuto")})</span>}
            </p>
          )}
          <details className="group" open={Boolean(account?.iban || account?.swift) || bank === OTHER}>
            <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">{t("foreignDetails")}</summary>
            <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_140px]">
              <Field label="IBAN" name="iban" value={iban} onChange={(e) => setIban(e.target.value)} placeholder={computedIban ? formatIban(computedIban) : "CZ65 0800 0000 1920 0014 5399"} className="font-mono" autoComplete="off" />
              <Field label="SWIFT / BIC" name="swift" value={swift} onChange={(e) => setSwift(e.target.value.toUpperCase())} className="font-mono" autoComplete="off" />
            </div>
          </details>
          <div className="grid grid-cols-[110px_1fr] gap-3">
            <NativeSelect
              label={t("currency")}
              name="currency"
              value={currency}
              onChange={(e) => changeCurrency(e.target.value)}
              options={[
                { value: "CZK", label: "CZK" },
                { value: "EUR", label: "EUR" },
              ]}
            />
            <Field
              label={t("label")}
              name="label"
              required
              value={label}
              onChange={(e) => {
                setLabel(e.target.value);
                setLabelTouched(true);
              }}
              placeholder={t("labelPlaceholder")}
            />
          </div>
          <CheckboxField name="isDefault" label={t("isDefault")} defaultChecked={account?.isDefault ?? isFirst ?? false} />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>{tc("cancel")}</Button>
            <SubmitButton>{tc("save")}</SubmitButton>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
