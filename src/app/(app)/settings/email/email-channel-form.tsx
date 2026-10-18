"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { deleteEmailChannelAction, saveEmailChannelAction, testEmailChannelAction } from "@/actions/email";
import type { EmailChannel } from "@/db/schema";
import { defaultTemplates } from "@/lib/mail-templates";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/components/form/field";
import { CheckboxField } from "@/components/form/checkbox-field";
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
  const [pending, start] = useTransition();

  function choosePreset(p: Preset) {
    setPreset(p);
    setHost(PRESETS[p].host);
    setPort(String(PRESETS[p].port));
    setSecure(PRESETS[p].secure);
  }

  async function submit(fd: FormData) {
    const r = await saveEmailChannelAction(fd);
    if (!r.ok) {
      toast.error(r.error === "password" ? t("passwordRequired") : tc("error"));
      return;
    }
    toast.success(tc("saved"));
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
        <Field label={t("fromEmail")} name="fromEmail" type="email" required value={fromEmail} onChange={(e) => { setFromEmail(e.target.value); if (!channel) setUsername(e.target.value); }} />
      </div>
      <div className="grid gap-4 sm:grid-cols-[1fr_100px]">
        <Field label={t("host")} name="host" required value={host} onChange={(e) => setHost(e.target.value)} readOnly={preset !== "custom"} />
        <Field label={t("port")} name="port" inputMode="numeric" required value={port} onChange={(e) => setPort(e.target.value)} readOnly={preset !== "custom"} />
      </div>
      {preset === "custom" && <CheckboxField name="secure" label={t("secure")} checked={secure} onChange={setSecure} />}
      {preset !== "custom" && <input type="hidden" name="secure" value={secure ? "true" : "false"} />}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t("username")} name="username" required value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="off" />
        <Field label={channel ? t("passwordKeep") : t("password")} name="password" type="password" autoComplete="new-password" required={!channel} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t("replyTo")} name="replyTo" type="email" defaultValue={channel?.replyTo ?? ""} />
        <Field label={t("bcc")} name="bcc" type="email" defaultValue={channel?.bcc ?? ""} placeholder={t("bccHint")} />
      </div>

      <div className="space-y-4 border-t pt-6">
        <h2 className="text-base font-medium">{t("templates")}</h2>
        <Field label={t("subjectTemplate")} name="subjectTemplate" defaultValue={channel?.subjectTemplate ?? ""} placeholder={defaultTemplates.cs.subject} />
        <div className="space-y-1.5">
          <Label htmlFor="bodyTemplate">{t("bodyTemplate")}</Label>
          <Textarea id="bodyTemplate" name="bodyTemplate" rows={7} defaultValue={channel?.bodyTemplate ?? ""} placeholder={defaultTemplates.cs.body} />
        </div>
        <p className="text-xs text-muted-foreground">
          {t("variables")}: <code>{"{typ} {cislo} {castka} {splatnost} {firma} {zakaznik} {odkaz}"}</code>
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <SubmitButton>{tc("save")}</SubmitButton>
        {channel && (
          <Button type="button" variant="outline" onClick={test} disabled={pending}>
            {pending ? t("testing") : t("test")}
          </Button>
        )}
        {channel?.verifiedAt && <span className="text-xs text-emerald-600">{t("verified")}</span>}
        {channel && (
          <div className="ml-auto">
            <ConfirmDelete action={deleteEmailChannelAction} title={t("deleteTitle")} />
          </div>
        )}
      </div>
    </form>
  );
}
