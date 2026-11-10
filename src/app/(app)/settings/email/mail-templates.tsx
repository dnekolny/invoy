"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Pencil, Plus } from "lucide-react";
import { toast } from "sonner";
import { deleteMailTemplateAction, saveMailTemplateAction } from "@/actions/email";
import type { MailTemplateOption } from "@/lib/mail-resolve";
import { defaultTemplates, MAIL_TOKENS } from "@/lib/mail-templates";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field } from "@/components/form/field";
import { TextareaField } from "@/components/form/textarea-field";
import { InsertChips } from "@/components/form/insert-chips";
import { ConfirmDelete } from "@/components/form/confirm-delete";

export function MailTemplates({ templates }: { templates: MailTemplateOption[] }) {
  const t = useTranslations("emailSettings");
  const tc = useTranslations("common");
  const router = useRouter();
  const [editing, setEditing] = useState<MailTemplateOption | null | "new">(null);
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const subjectRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const [pending, start] = useTransition();
  const tokens = MAIL_TOKENS.map((k) => ({ value: `{${k}}`, label: t(`tokens.${k}`) }));

  function open(tpl: MailTemplateOption | "new") {
    setName(tpl === "new" ? "" : tpl.name);
    setSubject(tpl === "new" ? defaultTemplates.cs.subject : tpl.subject);
    setBody(tpl === "new" ? defaultTemplates.cs.body : tpl.body);
    setEditing(tpl);
  }

  function save() {
    start(async () => {
      const r = await saveMailTemplateAction(editing === "new" || !editing ? null : editing.id, { name, subject, body });
      if (!r.ok) {
        toast.error(r.error === "invalid" ? tc("invalid") : tc("error"));
        return;
      }
      toast.success(tc("saved"));
      setEditing(null);
      router.refresh();
    });
  }

  return (
    <div className="space-y-4 border-t pt-6" data-mail-templates>
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-base font-medium">{t("namedTemplates")}</h2>
        <Button type="button" variant="outline" size="sm" onClick={() => open("new")}>
          <Plus />
          {t("addTemplate")}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">{t("namedTemplatesHint")}</p>
      {templates.length > 0 && (
        <ul className="divide-y rounded-lg border">
          {templates.map((tpl) => (
            <li key={tpl.id} className="flex items-center gap-3 px-3 py-2 text-sm">
              <div className="min-w-0 flex-1">
                <div className="font-medium">{tpl.name}</div>
                <div className="truncate text-xs text-muted-foreground">{tpl.subject}</div>
              </div>
              <Button type="button" variant="ghost" size="icon-sm" aria-label={tc("edit")} onClick={() => open(tpl)}>
                <Pencil />
              </Button>
              <ConfirmDelete action={() => deleteMailTemplateAction(tpl.id)} title={t("deleteTemplateTitle", { name: tpl.name })} description={t("deleteTemplateDescription")} />
            </li>
          ))}
        </ul>
      )}
      <Dialog open={editing !== null} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing === "new" ? t("addTemplate") : t("editTemplate")}</DialogTitle>
            <DialogDescription>{t("templatesHint")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Field label={t("templateName")} name="name" value={name} onChange={(e) => setName(e.target.value)} placeholder={t("templateNamePlaceholder")} autoFocus />
            <div className="space-y-1.5">
              <Field ref={subjectRef} label={t("subjectTemplate")} name="subject" value={subject} onChange={(e) => setSubject(e.target.value)} />
              <InsertChips tokens={tokens} targetRef={subjectRef} value={subject} onChange={setSubject} />
            </div>
            <div className="space-y-1.5">
              <TextareaField ref={bodyRef} label={t("bodyTemplate")} name="body" rows={8} value={body} onChange={(e) => setBody(e.target.value)} />
              <InsertChips tokens={tokens} targetRef={bodyRef} value={body} onChange={setBody} />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setEditing(null)}>{tc("cancel")}</Button>
              <Button onClick={save} disabled={pending || !name.trim() || !subject.trim() || !body.trim()}>{tc("save")}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
