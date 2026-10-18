"use client";

import { useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Plus, Trash2 } from "lucide-react";
import Decimal from "decimal.js";
import { toast } from "sonner";
import { addPaymentAction, deletePaymentAction } from "@/actions/invoices";
import type { Payment } from "@/db/schema";
import { todayIso } from "@/lib/dates";
import { formatDate, formatMoney } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Field } from "@/components/form/field";

type Props = { invoiceId: string; currency: string; total: string; paidAmount: string; payments: Payment[] };

export function PaymentsCard({ invoiceId, currency, total, paidAmount, payments }: Props) {
  const t = useTranslations("payments");
  const tc = useTranslations("common");
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const remaining = new Decimal(total).minus(paidAmount);
  const [date, setDate] = useState(todayIso());
  const [amount, setAmount] = useState(remaining.gt(0) ? remaining.toFixed(2) : "0");
  const [note, setNote] = useState("");

  function add() {
    start(async () => {
      const r = await addPaymentAction(invoiceId, { date, amount, note: note || null });
      if (!r.ok) {
        toast.error(tc("error"));
        return;
      }
      toast.success(t("added"));
      setOpen(false);
      setNote("");
    });
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">{t("title")}</CardTitle>
        {remaining.gt(0) && (
          <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (o) setAmount(remaining.toFixed(2)); }}>
            <DialogTrigger render={<Button size="sm" />}>
              <Plus />
              {t("markPaid")}
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t("addTitle")}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Field label={t("date")} name="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                <Field label={`${t("amount")} (${currency})`} name="amount" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} />
                <Field label={t("note")} name="note" value={note} onChange={(e) => setNote(e.target.value)} />
                <div className="flex justify-end">
                  <Button onClick={add} disabled={pending}>{tc("save")}</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">{t("paid")}</span>
          <span className="tabular-nums">{formatMoney(paidAmount, currency, locale)}</span>
        </div>
        <div className="flex justify-between font-medium">
          <span>{t("remaining")}</span>
          <span className={remaining.gt(0) ? "tabular-nums" : "text-emerald-600 tabular-nums"}>{formatMoney(remaining.toNumber(), currency, locale)}</span>
        </div>
        {payments.length > 0 && (
          <ul className="divide-y border-t pt-1">
            {payments.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-2 py-1.5">
                <div>
                  <div className="tabular-nums">{formatDate(p.date, locale)}</div>
                  {p.note && <div className="text-xs text-muted-foreground">{p.note}</div>}
                </div>
                <div className="flex items-center gap-1">
                  <span className="tabular-nums">{formatMoney(p.amount, currency, locale)}</span>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={tc("delete")}
                    disabled={pending}
                    onClick={() =>
                      start(async () => {
                        const r = await deletePaymentAction(p.id);
                        if (!r.ok) toast.error(tc("error"));
                      })
                    }
                  >
                    <Trash2 />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
