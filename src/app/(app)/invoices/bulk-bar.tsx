"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Download, FileArchive, Send, Trash2, Wallet, X } from "lucide-react";
import { toast } from "sonner";
import { bulkSendInvoicesAction } from "@/actions/email";
import { bulkDeleteDraftsAction, bulkMarkPaidAction } from "@/actions/invoices";
import { todayIso } from "@/lib/dates";
import { defaultTemplates, MAIL_TOKENS } from "@/lib/mail-templates";
import type { MailTemplateOption } from "@/lib/mail-resolve";
import { NativeSelect } from "@/components/form/native-select";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Field } from "@/components/form/field";
import { TextareaField } from "@/components/form/textarea-field";
import { CheckboxField } from "@/components/form/checkbox-field";
import { useSelection } from "./selection";

type Props = { hasChannel: boolean; templates: { subject: string | null; body: string | null }; namedTemplates: MailTemplateOption[] };

export function BulkBar({ hasChannel, templates, namedTemplates }: Props) {
  const t = useTranslations("invoices.bulk");
  const ts = useTranslations("send");
  const tc = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const { rows, selected, clear } = useSelection();
  const [pending, start] = useTransition();
  const [paidOpen, setPaidOpen] = useState(false);
  const [paidDate, setPaidDate] = useState(todayIso());
  const [sendOpen, setSendOpen] = useState(false);
  const defaults = defaultTemplates[locale === "en" ? "en" : "cs"];
  const main = { subject: templates.subject ?? defaults.subject, body: templates.body ?? defaults.body };
  const [templateId, setTemplateId] = useState("auto");
  const [subject, setSubject] = useState(main.subject);
  const [body, setBody] = useState(main.body);
  const [copyToMe, setCopyToMe] = useState(false);

  function chooseTemplate(id: string) {
    setTemplateId(id);
    const tpl = namedTemplates.find((n) => n.id === id) ?? main;
    setSubject(tpl.subject);
    setBody(tpl.body);
  }

  if (selected.size === 0) return null;
  const ids = [...selected];
  const picked = rows.filter((r) => selected.has(r.id));
  const payable = picked.filter((r) => r.payable).length;
  const sendable = picked.filter((r) => r.status !== "draft" && r.status !== "cancelled" && r.hasEmail).length;
  const drafts = picked.filter((r) => r.status === "draft").length;
  const exportable = picked.length - drafts;
  const query = `ids=${ids.join(",")}`;

  function finish(message: string) {
    toast.success(message);
    clear();
    router.refresh();
  }

  function markPaid() {
    start(async () => {
      const r = await bulkMarkPaidAction(ids, paidDate);
      if (!r.ok) {
        toast.error(tc("error"));
        return;
      }
      setPaidOpen(false);
      finish(t("paidDone", { n: r.done, skipped: r.skipped }));
    });
  }

  function send() {
    start(async () => {
      const r = await bulkSendInvoicesAction(templateId === "auto" ? { ids, copyToMe } : { ids, subject, body, copyToMe });
      if (!r.ok) {
        toast.error(r.error === "nochannel" ? ts("noChannel") : tc("error"));
        return;
      }
      setSendOpen(false);
      if (r.failed.length) toast.error(t("sendFailed", { n: r.failed.length, numbers: r.failed.map((f) => f.number).join(", ") }));
      finish(t("sendDone", { n: r.sent, skipped: r.skipped }));
    });
  }

  function deleteDrafts() {
    start(async () => {
      const r = await bulkDeleteDraftsAction(ids);
      if (!r.ok) {
        toast.error(tc("error"));
        return;
      }
      finish(t("deleted", { n: r.done }));
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2 border-b bg-primary/5 px-4 py-2 text-sm" data-bulk-bar>
      <span className="font-medium">{t("selected", { n: selected.size })}</span>
      <Button variant="ghost" size="sm" onClick={clear}>
        <X />
        {t("clear")}
      </Button>
      <span className="mx-1 hidden h-5 w-px bg-border sm:block" />

      <Popover open={paidOpen} onOpenChange={setPaidOpen}>
        <PopoverTrigger render={<Button variant="outline" size="sm" disabled={payable === 0 || pending} />}>
          <Wallet />
          {t("markPaid", { n: payable })}
        </PopoverTrigger>
        <PopoverContent align="start" className="w-72 gap-3 p-3">
          <div className="text-sm font-medium">{t("markPaidTitle")}</div>
          <p className="text-xs text-muted-foreground">{t("markPaidHint", { n: payable })}</p>
          <Field label={t("paidDate")} name="paidDate" type="date" value={paidDate} onChange={(e) => setPaidDate(e.target.value)} />
          <Button size="sm" onClick={markPaid} disabled={pending || !paidDate}>
            {t("confirm")}
          </Button>
        </PopoverContent>
      </Popover>

      <Button variant="outline" size="sm" nativeButton={false} render={<a href={`/api/invoices/zip?${query}`} />}>
        <FileArchive />
        {t("pdfZip")}
      </Button>

      <Dialog open={sendOpen} onOpenChange={setSendOpen}>
        <DialogTrigger render={<Button variant="outline" size="sm" disabled={pending} />}>
          <Send />
          {t("send", { n: sendable })}
        </DialogTrigger>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("sendTitle")}</DialogTitle>
            <DialogDescription>{t("sendDescription")}</DialogDescription>
          </DialogHeader>
          {!hasChannel ? (
            <div className="space-y-3 text-sm">
              <p>{ts("noChannel")}</p>
              <Button nativeButton={false} render={<Link href="/settings/email" />}>{ts("setupChannel")}</Button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm">
                {t("sendCount", { n: sendable })}
                {picked.length - sendable > 0 && <span className="text-muted-foreground"> · {t("sendSkipped", { n: picked.length - sendable })}</span>}
              </p>
              <NativeSelect
                label={ts("template")}
                name="template"
                value={templateId}
                onChange={(e) => chooseTemplate(e.target.value)}
                options={[{ value: "auto", label: t("templateAuto") }, { value: "", label: ts("templateMain") }, ...namedTemplates.map((n) => ({ value: n.id, label: n.name }))]}
              />
              {templateId === "auto" ? (
                <p className="text-xs text-muted-foreground">{t("templateAutoHint")}</p>
              ) : (
                <>
                  <Field label={ts("subject")} name="subject" value={subject} onChange={(e) => setSubject(e.target.value)} />
                  <TextareaField label={ts("body")} name="body" rows={9} value={body} onChange={(e) => setBody(e.target.value)} />
                  <p className="text-xs text-muted-foreground">{t("tokensHint", { list: MAIL_TOKENS.map((k) => `{${k}}`).join(" ") })}</p>
                </>
              )}
              <CheckboxField name="copyToMe" label={ts("copyToMe")} checked={copyToMe} onChange={setCopyToMe} />
              <div className="flex justify-end">
                <Button onClick={send} disabled={pending || sendable === 0}>
                  <Send />
                  {pending ? ts("sending") : t("sendButton", { n: sendable })}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="outline" size="sm" disabled={exportable === 0} />}>
          <Download />
          {t("export", { n: exportable })}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem render={<a href={`/api/export?${query}&format=xlsx`} />}>{t("exportXlsx")}</DropdownMenuItem>
          <DropdownMenuItem render={<a href={`/api/export?${query}&format=csv`} />}>{t("exportCsv")}</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog>
        <AlertDialogTrigger render={<Button variant="outline" size="sm" className="text-destructive" disabled={drafts === 0 || pending} />}>
          <Trash2 />
          {t("deleteDrafts", { n: drafts })}
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("deleteDescription", { n: drafts })}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tc("cancel")}</AlertDialogCancel>
            <AlertDialogAction disabled={pending} onClick={deleteDrafts}>{tc("delete")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
