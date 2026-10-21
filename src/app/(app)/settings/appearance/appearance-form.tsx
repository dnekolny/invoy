"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { ImagePlus, Pencil, Sparkles, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { saveAppearanceAction } from "@/actions/appearance";
import { deleteCustomTemplateAction } from "@/actions/templates";
import { AiTemplateDialog } from "./ai-template-dialog";
import { TEMPLATES } from "@/templates/labels";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { ScaledPage } from "@/components/scaled-page";

const COLORS = ["#2563eb", "#0f766e", "#7c3aed", "#db2777", "#ea580c", "#16a34a", "#0891b2", "#1f2937"];

type CustomTemplateRow = { id: string; name: string };

export function AppearanceForm(props: { template: string; accentColor: string; logoUrl: string | null; customTemplates: CustomTemplateRow[]; premium: boolean; aiReady: boolean }) {
  const t = useTranslations("appearance");
  const tc = useTranslations("common");
  const [template, setTemplate] = useState(props.template);
  const [editing, setEditing] = useState<CustomTemplateRow | null>(null);
  const [removing, startRemove] = useTransition();

  function remove(row: CustomTemplateRow) {
    if (!confirm(t("ai.deleteConfirm"))) return;
    startRemove(async () => {
      await deleteCustomTemplateAction(row.id);
      if (template === row.id) setTemplate("classic");
    });
  }
  const [accent, setAccent] = useState(props.accentColor);
  const [logo, setLogo] = useState<string | null>(props.logoUrl);
  const [pending, start] = useTransition();
  const [html, setHtml] = useState<string | null>(null);
  const previewKey = JSON.stringify({ template, accent, logo });
  const latest = useRef(previewKey);

  useEffect(() => {
    latest.current = previewKey;
    const timer = setTimeout(async () => {
      const res = await fetch("/api/preview-sample", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ template, accent, logoUrl: logo }) });
      if (res.ok && latest.current === previewKey) setHtml(await res.text());
    }, 300);
    return () => clearTimeout(timer);
  }, [previewKey, template, accent, logo]);

  async function onLogo(file: File | undefined) {
    if (!file) return;
    const data = await resizeImage(file, 600);
    if (!data) {
      toast.error(t("logoError"));
      return;
    }
    setLogo(data);
  }

  function save() {
    start(async () => {
      const r = await saveAppearanceAction({ template, accentColor: accent, logoUrl: logo });
      if (!r.ok) {
        toast.error(tc("error"));
        return;
      }
      toast.success(tc("saved"));
    });
  }

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <h2 className="text-base font-medium">{t("template")}</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {TEMPLATES.map((tpl) => (
            <button
              key={tpl.id}
              type="button"
              onClick={() => setTemplate(tpl.id)}
              className={cn("rounded-lg border-2 p-3 text-left transition-colors", template === tpl.id ? "border-primary" : "border-border hover:border-muted-foreground/40")}
            >
              <TemplateThumb id={tpl.id} accent={accent} />
              <div className="mt-2 text-sm font-medium">{tpl.name}</div>
              <div className="text-xs text-muted-foreground">{t(`desc.${tpl.id}`)}</div>
            </button>
          ))}
          {props.customTemplates.map((row) => (
            <div key={row.id} className={cn("relative rounded-lg border-2 p-3 text-left transition-colors", template === row.id ? "border-primary" : "border-border hover:border-muted-foreground/40")}>
              <button type="button" onClick={() => setTemplate(row.id)} className="block w-full text-left">
                <div className="flex aspect-[1/1.3] w-full items-center justify-center rounded bg-white text-muted-foreground shadow-sm ring-1 ring-black/5 dark:bg-neutral-100">
                  <Sparkles className="size-8" style={{ color: accent }} />
                </div>
                <div className="mt-2 text-sm font-medium">{row.name}</div>
                <div className="text-xs text-muted-foreground">{t("ai.customDesc")}</div>
              </button>
              <div className="absolute top-2 right-2 flex gap-1">
                <Button type="button" variant="outline" size="icon-sm" aria-label={tc("edit")} onClick={() => setEditing(row)}><Pencil /></Button>
                <Button type="button" variant="outline" size="icon-sm" aria-label={t("ai.delete")} disabled={removing} onClick={() => remove(row)}><Trash2 /></Button>
              </div>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <AiTemplateDialog premium={props.premium} aiReady={props.aiReady} />
          {editing && <AiTemplateDialog key={editing.id} premium={props.premium} aiReady={props.aiReady} editing={editing} onClose={() => setEditing(null)} />}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-medium">{t("accent")}</h2>
        <div className="flex flex-wrap items-center gap-2">
          {COLORS.map((c) => (
            <button key={c} type="button" aria-label={c} onClick={() => setAccent(c)} className={cn("size-8 rounded-full border-2", accent === c ? "border-foreground" : "border-transparent")} style={{ background: c }} />
          ))}
          <Input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="h-8 w-12 p-1" aria-label={t("customColor")} />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-medium">{t("logo")}</h2>
        <div className="flex items-center gap-4">
          <div className="flex h-20 w-40 items-center justify-center rounded-lg border bg-muted/40">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {logo ? <img src={logo} alt="" className="max-h-16 max-w-36 object-contain" /> : <span className="text-xs text-muted-foreground">{t("noLogo")}</span>}
          </div>
          <div className="flex gap-2">
            <Label className="cursor-pointer">
              <input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" className="hidden" onChange={(e) => onLogo(e.target.files?.[0])} />
              <span className="inline-flex h-8 items-center gap-1.5 rounded-lg border px-3 text-sm hover:bg-muted">
                <ImagePlus className="size-4" />
                {t("uploadLogo")}
              </span>
            </Label>
            {logo && (
              <Button type="button" variant="ghost" size="sm" onClick={() => setLogo(null)}>
                <X />
                {t("removeLogo")}
              </Button>
            )}
          </div>
        </div>
        <p className="text-xs text-muted-foreground">{t("logoHint")}</p>
      </section>

      <div className="flex items-center gap-3">
        <Button onClick={save} disabled={pending}>{tc("save")}</Button>
        <span className="text-xs text-muted-foreground">{t("previewHint")}</span>
      </div>

      <section className="space-y-3">
        <h2 className="text-base font-medium">{t("preview")}</h2>
        <div className="overflow-hidden rounded-lg border bg-[#e9e9ec]">
          {html ? <ScaledPage html={html} title={t("preview")} /> : <div className="h-[900px]" />}
        </div>
      </section>
    </div>
  );
}

function TemplateThumb({ id, accent }: { id: string; accent: string }) {
  return (
    <div className="aspect-[1/1.3] w-full overflow-hidden rounded bg-white p-2 text-[0px] shadow-sm ring-1 ring-black/5">
      {id === "modern" ? (
        <div className="-m-2 mb-2 h-8 p-2" style={{ background: accent }} />
      ) : (
        <div className="mb-2 flex justify-between"><div className="h-3 w-10 rounded bg-neutral-800" /><div className="size-3 rounded" style={{ background: accent }} /></div>
      )}
      <div className="mb-3 grid grid-cols-2 gap-2"><div className="h-6 rounded bg-neutral-200" /><div className="h-6 rounded bg-neutral-200" /></div>
      <div className="mb-1 h-2 rounded" style={{ background: id === "modern" ? accent : "#e5e7eb" }} />
      <div className="mb-1 h-2 rounded bg-neutral-100" />
      <div className="h-2 rounded bg-neutral-100" />
    </div>
  );
}

function resizeImage(file: File, max: number): Promise<string | null> {
  return new Promise((resolve) => {
    if (file.type === "image/svg+xml") {
      const r = new FileReader();
      r.onload = () => resolve(typeof r.result === "string" && r.result.length < 300_000 ? r.result : null);
      r.readAsDataURL(file);
      return;
    }
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement("canvas");
      c.width = Math.round(img.width * scale);
      c.height = Math.round(img.height * scale);
      c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
      resolve(c.toDataURL("image/png"));
    };
    img.onerror = () => resolve(null);
    img.src = URL.createObjectURL(file);
  });
}
