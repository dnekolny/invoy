"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { ImagePlus, X } from "lucide-react";
import { toast } from "sonner";
import { saveAppearanceAction } from "@/actions/appearance";
import { TEMPLATES } from "@/templates/labels";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const COLORS = ["#2563eb", "#0f766e", "#7c3aed", "#db2777", "#ea580c", "#16a34a", "#0891b2", "#1f2937"];

export function AppearanceForm(props: { template: string; accentColor: string; logoUrl: string | null }) {
  const t = useTranslations("appearance");
  const tc = useTranslations("common");
  const [template, setTemplate] = useState(props.template);
  const [accent, setAccent] = useState(props.accentColor);
  const [logo, setLogo] = useState<string | null>(props.logoUrl);
  const [pending, start] = useTransition();
  const [previewKey, setPreviewKey] = useState(0);

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
      setPreviewKey((k) => k + 1);
    });
  }

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <h2 className="text-base font-medium">{t("template")}</h2>
        <div className="grid grid-cols-2 gap-3">
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
          <iframe key={previewKey} title="preview" src={`/api/preview-sample?template=${template}`} className="h-[900px] w-full" />
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
