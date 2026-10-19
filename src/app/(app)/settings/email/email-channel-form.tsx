"use client";

import { useRef, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { deleteEmailChannelAction, saveEmailChannelAction, testEmailChannelAction } from "@/actions/email";
import type { EmailChannel } from "@/db/schema";
import { defaultTemplates, MAIL_TOKENS } from "@/lib/mail-templates";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/components/form/field";
import { EmailField } from "@/components/form/email-field";
import { CheckboxField } from "@/components/form/checkbox-field";
import { InsertChips } from "@/components/form/insert-chips";
import { SubmitButton } from "@/components/form/submit-button";
import { ConfirmDelete } from "@/components/form/confirm-delete";

const PRESETS = {
  gmail: { host: "smtp.gmail.com", port: 587, secure: false },
  seznam: { host: "smtp.seznam.cz", port: 465, secure: true },
  custom: { host: "", port: 587, secure: false },
} as const;

type Preset = keyof typeof PRESETS;

export function EmailChannelForm({ channel, defaults }: { channel: EmailChannel | null; defaults: { fromName: string; fromEmail: string } }) {
  const t = useTranslations("emailSettings");
  const tc = useTranslations("common");
  const [preset, setPreset] = useState<Preset>((channel?.preset as Preset) ?? "gmail");
  const [host, setHost] = useState(channel?.host ?? PRESETS.gmail.host);
  const [port, setPort] = useState(String(channel?.port ?? PRESETS.gmail.port));
  const [secure, setSecure] = useState(channel?.secure ?? PRESETS.gmail.secure);
  const [fromEmail, setFromEmail] = useState(channel?.fromEmail ?? defaults.fromEmail);
  const [username, setUsername] = useState(channel?.username ?? defaults.fromEmail);
  const [showPassword, setShowPassword] = useState(false);
  const [subject, setSubject] = useState(channel?.subjectTemplate ?? "");
  const [body, setBody] = useState(channel?.bodyTemplate ?? "");
  const subjectRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const [pending, start] = useTransition();
  const tokens = MAIL_TOKENS.map((k) => ({ value: `{${k}}`, label: t(`tokens.${k}`) }));

  function choosePreset(p: Preset) {
    setPreset(p);
    setHost(PRESETS[p].host);
    setPort(String(PRESETS[p].port));
    setSecure(PRESETS[p].secure);
  }

  async function submit(fd: FormData) {
    const r = await saveEmailChannelAction(fd);
    if (!r.ok) {
      toast.error(r.error === "password" ? t("passwordRequired") : r.error === "invalid" ? tc("invalid") : tc("error"));
      return;
    }
    toast.success(channel ? tc("saved") : t("savedTestHint"));
  }

  function test() {
    start(async () => {
      const r = await testEmailChannelAction();
      if (!r.ok) {
        toast.error(`${t("testFailed")}: ${r.error}`);
        return;
      }
      toast.success(t("testOk"));
    });
  }

  return (
    <form action={submit} className="space-y-6">
      <p className="text-sm text-muted-foreground">{t("intro")}</p>
      <div className="flex gap-1 rounded-lg bg-muted p-1">
        {(Object.keys(PRESETS) as Preset[]).map((p) => (
          <Button key={p} type="button" size="sm" variant={preset === p ? "secondary" : "ghost"} className={preset === p ? "flex-1 bg-background shadow-sm" : "flex-1"} onClick={() => choosePreset(p)}>
            {t(`preset.${p}`)}
          </Button>
        ))}
      </div>
      <input type="hidden" name="preset" value={preset} />
      {preset === "gmail" && (
        <div className="rounded-lg border bg-muted/40 p-3 text-xs leading-relaxed text-muted-foreground">
          {t("gmailHelp")}{" "}
          <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noreferrer" className="underline">myaccount.google.com/apppasswords</a>
        </div>
      )}
      {preset === "seznam" && <div className="rounded-lg border bg-muted/40 p-3 text-xs leading-relaxed text-muted-foreground">{t("seznamHelp")}</div>}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t("fromName")} name="fromName" required defaultValue={channel?.fromName ?? defaults.fromName} />
        <EmailField
          label={t("fromEmail")}
          name="fromEmail"
          required
          value={fromEmail}
          onChange={(v) => {
            setFromEmail(v);
            if (!channel) setUsername(v);
          }}
        />
      </div>
      {preset === "custom" && (
        <>
          <div className="grid gap-4 sm:grid-cols-[1fr_100px]">
            <Field label={t("host")} name="host" required value={host} onChange={(e) => setHost(e.target.value)} placeholder="smtp.domena.cz" />
            <Field label={t("port")} name="port" inputMode="numeric" required value={port} onChange={(e) => setPort(e.target.value)} />
          </div>
          <CheckboxField name="secure" label={t("secure")} checked={secure} onChange={setSecure} />
        </>
      )}
      {preset !== "custom" && (
        <>
          <input type="hidden" name="host" value={host} />
          <input type="hidden" name="port" value={port} />
          <input type="hidden" name="secure" value={secure ? "true" : "false"} />
        </>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t("username")} name="username" required value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="off" />
        <div className="space-y-1.5">
          <Label htmlFor="password">{channel ? t("passwordKeep") : t("password")}</Label>
          <div className="relative">
            <Input id="password" name="password" type={showPassword ? "text" : "password"} autoComplete="new-password" required={!channel} className="pr-9" />
            <button type="button" onClick={() => setShowPassword((s) => !s)} className="absolute top-1/2 right-2 -translate-y-1/2 text-muted-foreground hover:text-foreground" aria-label={showPassword ? t("hidePassword") : t("showPassword")}>
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </div>
      </div>
      <details open={Boolean(channel?.replyTo || channel?.bcc)}>
        <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">{t("advanced")}</summary>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <EmailField label={t("replyTo")} name="replyTo" defaultValue={channel?.replyTo ?? ""} />
          <EmailField label={t("bcc")} name="bcc" defaultValue={channel?.bcc ?? ""} />
        </div>
        <p className="mt-2 text-xs text-muted-foreground">{t("bccHint")}</p>
      </details>

      <div className="space-y-4 border-t pt-6">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-base font-medium">{t("templates")}</h2>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setSubject(defaultTemplates.cs.subject);
              setBody(defaultTemplates.cs.body);
            }}
          >
            {t("useDefault")}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">{t("templatesHint")}</p>
        <div className="space-y-1.5">
          <Label htmlFor="subjectTemplate">{t("subjectTemplate")}</Label>
          <Input ref={subjectRef} id="subjectTemplate" name="subjectTemplate" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder={defaultTemplates.cs.subject} />
          <InsertChips tokens={tokens} targetRef={subjectRef} value={subject} onChange={setSubject} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="bodyTemplate">{t("bodyTemplate")}</Label>
          <Textarea ref={bodyRef} id="bodyTemplate" name="bodyTemplate" rows={8} value={body} onChange={(e) => setBody(e.target.value)} placeholder={defaultTemplates.cs.body} />
          <InsertChips tokens={tokens} targetRef={bodyRef} value={body} onChange={setBody} />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <SubmitButton>{tc("save")}</SubmitButton>
        {channel && (
          <Button type="button" variant="outline" onClick={test} disabled={pending}>
            {pending ? t("testing") : t("test")}
          </Button>
        )}
        {channel?.verifiedAt && <span className="text-xs text-emerald-600">{t("verified")}</span>}
        {channel && !channel.verifiedAt && <span className="text-xs text-muted-foreground">{t("notVerified")}</span>}
        {channel && (
          <div className="ml-auto">
            <ConfirmDelete action={deleteEmailChannelAction} title={t("deleteTitle")} />
          </div>
        )}
      </div>
    </form>
  );
}
