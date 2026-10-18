"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Ban, CheckCircle2, Copy, FilePlus2, MoreHorizontal, RotateCcw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteInvoiceAction, duplicateInvoiceAction, invoiceFromProformaAction, issueInvoiceAction, setInvoiceStatusAction } from "@/actions/invoices";
import type { InvoiceStatus, InvoiceType } from "@/db/schema";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

type Props = { invoice: { id: string; status: InvoiceStatus; type: InvoiceType; customerId: string | null; proformaId: string | null } };

export function InvoiceActions({ invoice }: Props) {
  const t = useTranslations("invoiceDetail");
  const tc = useTranslations("common");
  const router = useRouter();
  const [pending, start] = useTransition();

  function run(fn: () => Promise<{ ok: boolean; error?: string; id?: string }>, success?: string, goto?: (id: string) => string) {
    start(async () => {
      const r = await fn();
      if (!r.ok) {
        toast.error(r.error === "customer" ? t("needCustomer") : tc("error"));
        return;
      }
      if (success) toast.success(success);
      if (goto && r.id) router.push(goto(r.id));
      router.refresh();
    });
  }

  return (
    <>
      {invoice.status === "draft" && (
        <Button size="sm" disabled={pending} onClick={() => run(() => issueInvoiceAction(invoice.id), t("issued"))}>
          <CheckCircle2 />
          {t("issue")}
        </Button>
      )}
      {invoice.type === "proforma" && invoice.status !== "draft" && invoice.status !== "cancelled" && (
        <Button size="sm" variant="outline" disabled={pending} onClick={() => run(() => invoiceFromProformaAction(invoice.id), t("invoiceCreated"), (id) => `/invoices/${id}`)}>
          <FilePlus2 />
          {t("createInvoice")}
        </Button>
      )}
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label={t("more")} />}>
          <MoreHorizontal />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => run(() => duplicateInvoiceAction(invoice.id), t("duplicated"), (id) => `/invoices/${id}/edit`)}>
            <Copy />
            {t("duplicate")}
          </DropdownMenuItem>
          {(invoice.status === "issued" || invoice.status === "sent") && (
            <DropdownMenuItem onClick={() => run(() => setInvoiceStatusAction(invoice.id, "cancelled"), t("cancelledOk"))}>
              <Ban />
              {t("cancel")}
            </DropdownMenuItem>
          )}
          {(invoice.status === "cancelled" || invoice.status === "paid") && (
            <DropdownMenuItem onClick={() => run(() => setInvoiceStatusAction(invoice.id, "issued"), tc("saved"))}>
              <RotateCcw />
              {invoice.status === "paid" ? t("unpay") : t("restore")}
            </DropdownMenuItem>
          )}
          {invoice.status === "draft" && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onClick={() => run(() => deleteInvoiceAction(invoice.id))}>
                <Trash2 />
                {t("deleteDraft")}
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
