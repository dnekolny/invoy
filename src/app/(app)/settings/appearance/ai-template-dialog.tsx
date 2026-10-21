"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ImagePlus, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { generateTemplateAction, getCustomTemplateHtml, saveCustomTemplateAction } from "@/actions/templates";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Field } from "@/components/form/field";
import { TextareaField } from "@/components/form/textarea-field";
import { ScaledPage } from "@/components/scaled-page";
import { cn } from "@/lib/utils";

type Props = { premium: boolean; aiReady: boolean; editing?: { id: string; name: string } | null; onClose?: () => void };

export function AiTemplateDialog({ premium, aiReady, editing, onClose }: Props) {
  const t = useTranslations("appearance.ai");
  const tc = useTranslations("common");
  const router = useRouter();
  const [open, setOpen] = useState(Boolean(editing));
  const [image, setImage] = useState<{ file: File; url: string } | null>(null);
  const [instructions, setInstructions] = useState("");
  const [html, setHtml] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [name, setName] = useState(editing?.name ?? "");
  const [dragging, setDragging] = useState(false);
  const [generating, startGenerate] = useTransition();
  const [saving, startSave] = useTransition();

  function change(o: boolean) {
    setOpen(o);
    if (!o) onClose?.();
  }

  useEffect(() => {
    if (!editing) return;
    let cancelled = false;
    getCustomTemplateHtml(editing.id).then(async (existing) => {
      if (cancelled || !existing) return;
      setHtml(existing);
      setPreview(await fetchPreview(existing));
    });
    return () => {
      cancelled = true;
    };
  }, [editing]);

  const canUpload = open && premium && aiReady;
  useEffect(() => {
    if (!canUpload) return;
    function onPaste(e: ClipboardEvent) {
      const item = Array.from(e.clipboardData?.items ?? []).find((i) => i.type.startsWith("image/"));
      const file = item?.getAsFile();
      if (!file) return;
      e.preventDefault();
      pick(file);
    }
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  });

  async function renderPreview(src: string) {
    setPreview(await fetchPreview(src));
  }

  function pick(file: File | undefined) {
    if (!file) return;
    resize(file, 1600).then((blob) => {
      if (!blob) {
        toast.error(t("imageError"));
        return;
      }
      const f = new File([blob], "reference.jpg", { type: "image/jpeg" });
      setImage({ file: f, url: URL.createObjectURL(f) });
    });
  }

  function generate() {
    if (!image && !html) return;
    startGenerate(async () => {
      const fd = new FormData();
      if (image) fd.set("image", image.file);
      fd.set("instructions", instructions);
      if (html) fd.set("previousHtml", html);
      const r = await generateTemplateAction(fd);
      if (!r.ok) {
        toast.error(t(`errors.${r.error}`));
        return;
      }
      setHtml(r.html);
      setInstructions("");
      await renderPreview(r.html);
    });
  }

  function save() {
    if (!html) return;
    startSave(async () => {
      const r = await saveCustomTemplateAction({ id: editing?.id, name: name || t("defaultName"), html });
      if (!r.ok) {
        toast.error(tc("error"));
        return;
      }
      toast.success(t("saved"));
      change(false);
      router.refresh();
    });
  }

  const locked = !premium;

  return (
    <Dialog open={open} onOpenChange={change}>
      {!editing && (
        <DialogTrigger render={<Button variant="outline" />}>
          <Sparkles className="text-primary" />
          {t("open")}
          <span className="ml-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-primary uppercase">Premium</span>
        </DialogTrigger>
      )}
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="size-4 text-primary" />
            {editing ? t("editTitle") : t("title")}
          </DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>

        {locked ? (
          <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 text-sm">
            <div className="font-medium">{t("premiumTitle")}</div>
            <p className="mt-1 text-muted-foreground">{t("premiumText")}</p>
          </div>
        ) : !aiReady ? (
          <div className="rounded-lg border border-amber-300/60 bg-amber-50 p-4 text-sm text-amber-900 dark:bg-amber-950/30 dark:text-amber-200">{t("errors.notConfigured")}</div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
            <div className="space-y-4">
              <label className={cn("flex aspect-[3/4] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-lg border-2 border-dashed bg-muted/30 text-sm text-muted-foreground hover:border-primary/50", image && "border-solid", dragging && "border-primary bg-primary/5")}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragging(false);
                  pick(Array.from(e.dataTransfer.files).find((f) => f.type.startsWith("image/")));
                }}>
                <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(e) => pick(e.target.files?.[0])} />
                {image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={image.url} alt="" className="h-full w-full object-contain" />
                ) : (
                  <>
                    <ImagePlus className="mb-2 size-6" />
                    <span className="px-4 text-center">{editing ? t("dropHintOptional") : t("dropHint")}</span>
                    <span className="mt-2 px-4 text-center text-xs">{t("pasteHint")}</span>
                  </>
                )}
              </label>
              <TextareaField label={html ? t("tweakLabel") : t("instructionsLabel")} name="instructions" value={instructions} onChange={(e) => setInstructions(e.target.value)} rows={3} placeholder={html ? t("tweakPlaceholder") : t("instructionsPlaceholder")} />
              <Button onClick={generate} disabled={(!image && !html) || generating} className="w-full">
                {generating ? <Loader2 className="animate-spin" /> : <Sparkles />}
                {generating ? t("generating") : html ? t("regenerate") : t("generate")}
              </Button>
              <p className="text-xs text-muted-foreground">{t("costHint")}</p>
              {html && (
                <div className="space-y-3 border-t pt-4">
                  <Field label={t("nameLabel")} name="name" value={name} onChange={(e) => setName(e.target.value)} placeholder={t("defaultName")} />
                  <Button onClick={save} disabled={saving} variant="default" className="w-full">
                    {saving && <Loader2 className="animate-spin" />}
                    {editing ? tc("save") : t("saveUse")}
                  </Button>
                </div>
              )}
            </div>
            <div className="overflow-hidden rounded-lg border bg-[#e9e9ec] dark:bg-black/40">
              {preview ? (
                <ScaledPage html={preview} title={t("preview")} />
              ) : (
                <div className="flex h-96 items-center justify-center px-6 text-center text-sm text-muted-foreground">{generating ? t("generatingHint") : t("emptyPreview")}</div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

async function fetchPreview(src: string) {
  const res = await fetch("/api/preview-sample", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ customHtml: src }) });
  return res.ok ? res.text() : null;
}

function resize(file: File, max: number): Promise<Blob | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement("canvas");
      c.width = Math.round(img.width * scale);
      c.height = Math.round(img.height * scale);
      const ctx = c.getContext("2d")!;
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, c.width, c.height);
      ctx.drawImage(img, 0, 0, c.width, c.height);
      c.toBlob((b) => resolve(b), "image/jpeg", 0.9);
    };
    img.onerror = () => resolve(null);
    img.src = URL.createObjectURL(file);
  });
}
