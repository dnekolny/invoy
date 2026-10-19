"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { issueInvoiceAction, saveInvoiceAction } from "@/actions/invoices";
import type { BankAccount, Company, Customer, Item, InvoiceType } from "@/db/schema";
import type { InvoiceWithLines } from "@/lib/invoices";
import { addDays, todayIso } from "@/lib/dates";
import { peekNumber } from "@/lib/invoice-number-peek";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/components/form/field";
import { NativeSelect } from "@/components/form/native-select";
import { LinesEditor, newLine, type EditorLine } from "@/components/lines-editor";
import { CustomerDialog } from "../customers/customer-dialog";

type Props = {
  company: Company;
  customers: Customer[];
  bankAccounts: BankAccount[];
  items: Item[];
  counters: Record<string, number>;
  invoice?: InvoiceWithLines;
  initialType?: InvoiceType;
  initialCustomerId?: string;
};

const DUE_PRESETS = [7, 14, 30];

export function InvoiceEditor({ company, customers: initialCustomers, bankAccounts, items, counters, invoice, initialType, initialCustomerId }: Props) {
  const t = useTranslations("invoiceEditor");
  const tc = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const [pending, start] = useTransition();
  const isDraft = !invoice || invoice.status === "draft";

  const [customers, setCustomers] = useState(initialCustomers);
  const [type, setType] = useState<InvoiceType>(invoice?.type ?? initialType ?? "invoice");
  const [customerId, setCustomerId] = useState(invoice?.customerId ?? initialCustomerId ?? "");
  const initialCustomer = initialCustomers.find((c) => c.id === (invoice?.customerId ?? initialCustomerId));
  const [issueDate, setIssueDate] = useState(invoice?.issueDate ?? todayIso());
  const [taxDate, setTaxDate] = useState(invoice?.taxDate ?? invoice?.issueDate ?? todayIso());
  const [dueDate, setDueDate] = useState(invoice?.dueDate ?? addDays(todayIso(), initialCustomer?.dueDays ?? company.defaultDueDays));
  const [currency, setCurrency] = useState(invoice?.currency ?? initialCustomer?.currency ?? company.defaultCurrency);
  const [language, setLanguage] = useState(invoice?.language ?? initialCustomer?.language ?? "cs");
  const [bankAccountId, setBankAccountId] = useState(invoice?.bankAccountId ?? defaultBank(bankAccounts, invoice?.currency ?? initialCustomer?.currency ?? company.defaultCurrency));
  const [note, setNote] = useState(invoice?.note ?? "");
  const [lines, setLines] = useState<EditorLine[]>(
    invoice?.lines.length
      ? invoice.lines.map((l) => newLine({ name: l.name, quantity: trimNum(l.quantity), unit: l.unit, unitPrice: trimNum(l.unitPrice), vatRate: l.vatRate }))
      : [newLine()]
  );
  const dirty = useRef(false);
  const saved = useRef(false);

  useEffect(() => {
    function warn(e: BeforeUnloadEvent) {
      if (dirty.current && !saved.current) e.preventDefault();
    }
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, []);

  useEffect(() => {
    function key(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        save(false);
      }
    }
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  });

  const customer = useMemo(() => customers.find((c) => c.id === customerId), [customers, customerId]);
  const dueDays = Math.round((Date.parse(dueDate) - Date.parse(issueDate)) / 86400000);
  const pattern = type === "proforma" ? company.proformaPattern : company.invoicePattern;
  const nextNumber = isDraft && issueDate ? peekNumber(counters, type, pattern, issueDate) : null;

  function mark() {
    dirty.current = true;
  }

  function pickCustomer(id: string) {
    mark();
    setCustomerId(id);
    const c = customers.find((x) => x.id === id);
    if (!c) return;
    setLanguage(c.language);
    setCurrency(c.currency);
    setBankAccountId(defaultBank(bankAccounts, c.currency));
    setDueDate(addDays(issueDate, c.dueDays ?? company.defaultDueDays));
  }

  function changeIssueDate(v: string) {
    mark();
    const days = dueDays >= 0 ? dueDays : (customer?.dueDays ?? company.defaultDueDays);
    setIssueDate(v);
    setTaxDate(v);
    if (v) setDueDate(addDays(v, days));
  }

  function payload() {
    return {
      type,
      customerId: customerId || null,
      issueDate,
      taxDate: company.vatPayer ? taxDate || issueDate : null,
      dueDate,
      currency,
      language,
      bankAccountId: bankAccountId || null,
      note: note.trim() || null,
      lines: lines
        .filter((l) => l.name.trim())
        .map((l) => ({ name: l.name, quantity: l.quantity || "1", unit: l.unit || "ks", unitPrice: l.unitPrice || "0", vatRate: l.vatRate })),
    };
  }

  function save(issue: boolean) {
    if (pending) return;
    const p = payload();
    if (p.lines.length === 0) {
      toast.error(t("needLine"));
      return;
    }
    if (issue && !p.customerId) {
      toast.error(t("needCustomer"));
      return;
    }
    if (p.dueDate < p.issueDate) {
      toast.error(t("dueBeforeIssue"));
      return;
    }
    start(async () => {
      const r = await saveInvoiceAction(invoice?.id ?? null, p);
      if (!r.ok) {
        toast.error(r.error === "invalid" ? tc("invalid") : tc("error"));
        return;
      }
      saved.current = true;
      if (issue) {
        const i = await issueInvoiceAction(r.id);
        if (!i.ok) {
          toast.error(tc("error"));
          router.push(`/invoices/${r.id}`);
          return;
        }
        toast.success(t("issued"));
      } else {
        toast.success(tc("saved"));
      }
      router.push(`/invoices/${r.id}`);
      router.refresh();
    });
  }

  const selectClass = "h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30";

  return (
    <div className="space-y-6" onChange={mark}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">
            {invoice ? (invoice.number ?? t("draft")) : t(type === "proforma" ? "newProforma" : "newInvoice")}
          </h1>
          {!invoice && (
            <div className="mt-2 flex gap-1">
              {(["invoice", "proforma"] as const).map((k) => (
                <Button key={k} type="button" size="sm" variant={type === k ? "secondary" : "ghost"} onClick={() => { mark(); setType(k); }}>
                  {t(k === "invoice" ? "typeInvoice" : "typeProforma")}
                </Button>
              ))}
            </div>
          )}
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className="flex gap-2">
            <Button variant="ghost" nativeButton={false} render={<Link href={invoice ? `/invoices/${invoice.id}` : "/invoices"} />}>{tc("cancel")}</Button>
            <Button variant="outline" disabled={pending} onClick={() => save(false)}>
              {isDraft ? t("saveDraft") : tc("save")}
            </Button>
            {isDraft && (
              <Button disabled={pending} onClick={() => save(true)}>
                {t("issue")}
              </Button>
            )}
          </div>
          {nextNumber && <p className="text-xs text-muted-foreground">{t("nextNumber", { number: nextNumber })}</p>}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("customer")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <select className={selectClass} value={customerId} onChange={(e) => pickCustomer(e.target.value)} autoFocus={!invoice && !customerId}>
                  <option value="">{customers.length ? t("pickCustomer") : t("noCustomers")}</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <CustomerDialog
                  defaultCurrency={company.defaultCurrency}
                  onCreated={(c) => {
                    setCustomers((list) => [...list, c].sort((a, b) => a.name.localeCompare(b.name)));
                    setCustomerId(c.id);
                    setLanguage(c.language);
                    setCurrency(c.currency);
                    setBankAccountId(defaultBank(bankAccounts, c.currency));
                    setDueDate(addDays(issueDate, c.dueDays ?? company.defaultDueDays));
                    mark();
                    router.refresh();
                  }}
                />
              </div>
              {customer && (
                <div className="flex items-start justify-between gap-3 rounded-lg bg-muted/60 p-3 text-sm leading-relaxed">
                  <div>
                    <div className="font-medium">{customer.name}</div>
                    {customer.street && <div>{customer.street}</div>}
                    {(customer.zip || customer.city) && <div>{[customer.zip, customer.city].filter(Boolean).join(" ")}</div>}
                    {(customer.ico || customer.dic) && (
                      <div className="text-muted-foreground">
                        {customer.ico && <>IČO {customer.ico}</>} {customer.dic && <>· DIČ {customer.dic}</>}
                      </div>
                    )}
                    {customer.email ? <div className="text-muted-foreground">{customer.email}</div> : <div className="text-xs text-amber-700">{t("noCustomerEmail")}</div>}
                  </div>
                  <Link href={`/customers/${customer.id}`} className="shrink-0 text-xs text-muted-foreground underline-offset-2 hover:underline">{tc("edit")}</Link>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("lines")}</CardTitle>
            </CardHeader>
            <CardContent>
              <LinesEditor lines={lines} onChange={(l) => { mark(); setLines(l); }} items={items} vatPayer={company.vatPayer} currency={currency} locale={locale} />
              {items.length === 0 && (
                <p className="mt-3 text-xs text-muted-foreground">
                  <Link href="/settings/items" className="underline">{t("priceListHint")}</Link>
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("note")}</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder={t("notePlaceholder")} />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("details")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Field label={t("issueDate")} name="issueDate" type="date" value={issueDate} onChange={(e) => changeIssueDate(e.target.value)} />
              {company.vatPayer && type === "invoice" && (
                <Field label={t("taxDate")} name="taxDate" type="date" value={taxDate} onChange={(e) => setTaxDate(e.target.value)} />
              )}
              <div className="space-y-1.5">
                <Field label={t("dueDate")} name="dueDate" type="date" value={dueDate} min={issueDate} onChange={(e) => setDueDate(e.target.value)} />
                <div className="flex flex-wrap gap-1">
                  {DUE_PRESETS.map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => { mark(); setDueDate(addDays(issueDate, d)); }}
                      className={`rounded-md border px-2 py-0.5 text-xs ${dueDays === d ? "border-foreground bg-foreground text-background" : "bg-muted/60 hover:bg-muted"}`}
                    >
                      {t("daysShort", { n: d })}
                    </button>
                  ))}
                  {!DUE_PRESETS.includes(dueDays) && dueDays >= 0 && <span className="self-center text-xs text-muted-foreground">{t("daysShort", { n: dueDays })}</span>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <NativeSelect
                  label={t("currency")}
                  name="currency"
                  value={currency}
                  onChange={(e) => {
                    setCurrency(e.target.value);
                    setBankAccountId(defaultBank(bankAccounts, e.target.value));
                  }}
                  options={[
                    { value: "CZK", label: "CZK" },
                    { value: "EUR", label: "EUR" },
                  ]}
                />
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
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="bankAccountId">{t("bankAccount")}</Label>
                <select id="bankAccountId" className={selectClass} value={bankAccountId} onChange={(e) => setBankAccountId(e.target.value)}>
                  <option value="">{t("noBankAccount")}</option>
                  {bankAccounts.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.label} ({b.currency})
                    </option>
                  ))}
                </select>
                {bankAccounts.length === 0 ? (
                  <p className="text-xs text-amber-700">
                    <Link href="/settings/bank-accounts" className="underline">{t("addBankAccount")}</Link>
                  </p>
                ) : (
                  !bankAccountId && <p className="text-xs text-amber-700">{t("noBankWarning")}</p>
                )}
              </div>
              {currency !== "CZK" && company.vatPayer && <p className="text-xs text-muted-foreground">{t("cnbNote")}</p>}
            </CardContent>
          </Card>
          <p className="text-xs text-muted-foreground">{t("shortcutHint")}</p>
        </div>
      </div>
    </div>
  );
}

function defaultBank(accounts: BankAccount[], currency: string) {
  return (accounts.find((b) => b.currency === currency && b.isDefault) ?? accounts.find((b) => b.currency === currency) ?? accounts.find((b) => b.isDefault) ?? accounts[0])?.id ?? "";
}

function trimNum(v: string) {
  return v.replace(/\.?0+$/, "").replace(/\.$/, "") || "0";
}
