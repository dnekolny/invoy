"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Plus } from "lucide-react";
import { createCustomerInlineAction } from "@/actions/customers";
import type { Customer } from "@/db/schema";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CustomerForm } from "./customer-form";

export function CustomerDialog({ defaultCurrency, onCreated }: { defaultCurrency: string; onCreated: (c: Customer) => void }) {
  const t = useTranslations("customers");
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        <Plus />
        {t("add")}
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{t("newTitle")}</DialogTitle>
        </DialogHeader>
        <CustomerForm
          compact
          defaultCurrency={defaultCurrency}
          onCancel={() => setOpen(false)}
          action={async (fd) => {
            const r = await createCustomerInlineAction(fd);
            if (r.ok) {
              onCreated(r.customer);
              setOpen(false);
            }
            return r;
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
