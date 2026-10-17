"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Pencil, Plus } from "lucide-react";
import { toast } from "sonner";
import { saveBankAccountAction } from "@/actions/bank-accounts";
import type { BankAccount } from "@/db/schema";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Field } from "@/components/form/field";
import { NativeSelect } from "@/components/form/native-select";
import { CheckboxField } from "@/components/form/checkbox-field";
import { SubmitButton } from "@/components/form/submit-button";

export function BankAccountDialog({ account }: { account?: BankAccount }) {
  const t = useTranslations("bank");
  const tc = useTranslations("common");
  const [open, setOpen] = useState(false);

  async function submit(fd: FormData) {
    const r = await saveBankAccountAction(account?.id ?? null, fd);
    if (!r.ok) {
      toast.error(tc("error"));
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{account ? t("editTitle") : t("addTitle")}</DialogTitle>
        </DialogHeader>
        <form action={submit} className="space-y-4">
          <Field label={t("label")} name="label" required defaultValue={account?.label ?? ""} placeholder={t("labelPlaceholder")} />
          <div className="grid grid-cols-[1fr_120px] gap-4">
            <Field label={t("accountNumber")} name="accountNumber" defaultValue={account?.accountNumber ?? ""} />
            <Field label={t("bankCode")} name="bankCode" defaultValue={account?.bankCode ?? ""} inputMode="numeric" />
          </div>
          <div className="grid gap-4 sm:grid-cols-[1fr_140px]">
            <Field label="IBAN" name="iban" defaultValue={account?.iban ?? ""} />
            <Field label="SWIFT / BIC" name="swift" defaultValue={account?.swift ?? ""} />
          </div>
          <NativeSelect
            label={t("currency")}
            name="currency"
            defaultValue={account?.currency ?? "CZK"}
            options={[
              { value: "CZK", label: "CZK" },
              { value: "EUR", label: "EUR" },
            ]}
          />
          <CheckboxField name="isDefault" label={t("isDefault")} defaultChecked={account?.isDefault ?? false} />
          <div className="flex justify-end">
            <SubmitButton>{tc("save")}</SubmitButton>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
