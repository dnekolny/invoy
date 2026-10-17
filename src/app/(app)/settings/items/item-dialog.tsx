"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Pencil, Plus } from "lucide-react";
import { toast } from "sonner";
import { saveItemAction } from "@/actions/items";
import type { Item } from "@/db/schema";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Field } from "@/components/form/field";
import { NativeSelect } from "@/components/form/native-select";
import { SubmitButton } from "@/components/form/submit-button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function ItemDialog({ item, vatPayer }: { item?: Item; vatPayer: boolean }) {
  const t = useTranslations("items");
  const tc = useTranslations("common");
  const [open, setOpen] = useState(false);

  async function submit(fd: FormData) {
    const r = await saveItemAction(item?.id ?? null, fd);
    if (!r.ok) {
      toast.error(tc("error"));
      return;
    }
    toast.success(tc("saved"));
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={item ? <Button variant="ghost" size="icon-sm" aria-label={tc("edit")} /> : <Button size="sm" />}>
        {item ? <Pencil /> : <><Plus />{t("add")}</>}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{item ? t("editTitle") : t("addTitle")}</DialogTitle>
        </DialogHeader>
        <form action={submit} className="space-y-4">
          <Field label={t("name")} name="name" required defaultValue={item?.name ?? ""} />
          <div className="space-y-1.5">
            <Label htmlFor="description">{t("description")}</Label>
            <Textarea id="description" name="description" rows={2} defaultValue={item?.description ?? ""} />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Field label={t("unitPrice")} name="unitPrice" type="number" step="0.01" min={0} required defaultValue={item?.unitPrice ?? ""} />
            <Field label={t("unit")} name="unit" defaultValue={item?.unit ?? "ks"} />
            {vatPayer ? (
              <NativeSelect
                label={t("vatRate")}
                name="vatRate"
                defaultValue={String(item?.vatRate ?? 21)}
                options={[
                  { value: "21", label: "21 %" },
                  { value: "12", label: "12 %" },
                  { value: "0", label: "0 %" },
                ]}
              />
            ) : (
              <input type="hidden" name="vatRate" value="0" />
            )}
          </div>
          <div className="flex justify-end">
            <SubmitButton>{tc("save")}</SubmitButton>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
