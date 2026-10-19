"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Send } from "lucide-react";
import { toast } from "sonner";
import { sendInvoiceAction } from "@/actions/email";
import { defaultTemplates, fillTemplate, type MailContext } from "@/lib/mail-templates";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/components/form/field";
import { EmailField } from "@/components/form/email-field";
import { CheckboxField } from "@/components/form/checkbox-field";

type Props = { invoiceId: string; defaultTo: string; hasChannel: boolean; alreadySent?: boolean; context: MailContext; templates: { subject: string | null; body: string | null } };

export function SendDialog({ invoiceId, defaultTo, hasChannel, alreadySent, context, templates }: Props) {
  const t = useTranslations("send");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const defaults = defaultTemplates[context.lang === "en" ? "en" : "cs"];
  const [to, setTo] = useState(defaultTo);
  const [subject, setSubject] = useState(fillTemplate(templates.subject ?? defaults.subject, context));
  const [body, setBody] = useState(fillTemplate(templates.body ?? defaults.body, context));
  const [copyToMe, setCopyToMe] = useState(false);

  function send() {
    start(async () => {
      const r = await sendInvoiceAction(invoiceId, { to, subject, body, copyToMe });
      if (!r.ok) {
        toast.error(r.error === "nochannel" ? t("noChannel") : `${t("failed")}: ${r.error}`);
        return;
      }
      toast.success(t("sent"));
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" variant={alreadySent ? "outline" : "default"} />}>
        <Send />
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
            <EmailField label={t("to")} name="to" value={to} onChange={setTo} required autoFocus={!to} />
            <Field label={t("subject")} name="subject" value={subject} onChange={(e) => setSubject(e.target.value)} />
            <div className="space-y-1.5">
              <Label htmlFor="body">{t("body")}</Label>
              <Textarea id="body" rows={9} value={body} onChange={(e) => setBody(e.target.value)} />
            </div>
            <CheckboxField name="copyToMe" label={t("copyToMe")} checked={copyToMe} onChange={setCopyToMe} />
            <p className="text-xs text-muted-foreground">{t("attachmentNote")}</p>
            <div className="flex justify-end">
              <Button onClick={send} disabled={pending || !to}>
                <Send />
                {pending ? t("sending") : t("button")}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
