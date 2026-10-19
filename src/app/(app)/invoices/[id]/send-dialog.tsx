"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { BellRing, Send } from "lucide-react";
import { toast } from "sonner";
import { sendInvoiceAction, sendReminderAction } from "@/actions/email";
import { defaultReminderTemplates, defaultTemplates, fillTemplate, type MailContext } from "@/lib/mail-templates";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { TextareaField } from "@/components/form/textarea-field";
import { Field } from "@/components/form/field";
import { EmailField } from "@/components/form/email-field";
import { CheckboxField } from "@/components/form/checkbox-field";

type Props = { invoiceId: string; defaultTo: string; hasChannel: boolean; alreadySent?: boolean; mode?: "invoice" | "reminder"; context: MailContext; templates: { subject: string | null; body: string | null } };

export function SendDialog({ invoiceId, defaultTo, hasChannel, alreadySent, mode = "invoice", context, templates }: Props) {
  const t = useTranslations(mode === "reminder" ? "reminder" : "send");
  const ts = useTranslations("send");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const defaults = (mode === "reminder" ? defaultReminderTemplates : defaultTemplates)[context.lang === "en" ? "en" : "cs"];
  const [to, setTo] = useState(defaultTo);
  const [subject, setSubject] = useState(fillTemplate(templates.subject ?? defaults.subject, context));
  const [body, setBody] = useState(fillTemplate(templates.body ?? defaults.body, context));
  const [copyToMe, setCopyToMe] = useState(false);

  function send() {
    start(async () => {
      const r = await (mode === "reminder" ? sendReminderAction : sendInvoiceAction)(invoiceId, { to, subject, body, copyToMe });
      if (!r.ok) {
        toast.error(r.error === "nochannel" ? ts("noChannel") : `${ts("failed")}: ${r.error}`);
        return;
      }
      toast.success(t("sent"));
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" variant={alreadySent || mode === "reminder" ? "outline" : "default"} />}>
        {mode === "reminder" ? <BellRing /> : <Send />}
        {alreadySent ? t("buttonAgain") : t("button")}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>
        {!hasChannel ? (
          <div className="space-y-3 text-sm">
            <p>{t("noChannel")}</p>
            <Button nativeButton={false} render={<Link href="/settings/email" />}>{t("setupChannel")}</Button>
          </div>
        ) : (
          <div className="space-y-4">
            <EmailField label={ts("to")} name="to" value={to} onChange={setTo} required autoFocus={!to} />
            <Field label={ts("subject")} name="subject" value={subject} onChange={(e) => setSubject(e.target.value)} />
            <TextareaField label={ts("body")} name="body" rows={9} value={body} onChange={(e) => setBody(e.target.value)} />
            <CheckboxField name="copyToMe" label={ts("copyToMe")} checked={copyToMe} onChange={setCopyToMe} />
            <p className="text-xs text-muted-foreground">{ts("attachmentNote")}</p>
            <div className="flex justify-end">
              <Button onClick={send} disabled={pending || !to}>
                <Send />
                {pending ? ts("sending") : t("button")}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
