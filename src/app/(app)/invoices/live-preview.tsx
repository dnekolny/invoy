"use client";

import { useEffect, useRef, useState } from "react";

const PAGE_W = 794;
const PAGE_H = 1123;
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";

export function LivePreview({ payload }: { payload: unknown }) {
  const t = useTranslations("invoiceEditor");
  const [html, setHtml] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const key = JSON.stringify(payload);
  const latest = useRef(key);
  const box = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setScale(Math.min(1, entry.contentRect.width / PAGE_W)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    latest.current = key;
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/invoices/preview", { method: "POST", headers: { "content-type": "application/json" }, body: key });
        if (res.ok && latest.current === key) setHtml(await res.text());
      } finally {
        if (latest.current === key) setLoading(false);
      }
    }, 600);
    return () => clearTimeout(timer);
  }, [key]);

  return (
    <div ref={box} className="relative overflow-hidden rounded-xl border bg-[#e9e9ec] dark:bg-black/40">
      {loading && (
        <div className="absolute top-2 right-2 z-10 flex items-center gap-1 rounded-md bg-card/90 px-2 py-1 text-xs text-muted-foreground shadow-sm">
          <Loader2 className="size-3 animate-spin" />
          {t("previewUpdating")}
        </div>
      )}
      {html ? (
        <div style={{ height: PAGE_H * scale }}>
          <iframe title={t("preview")} srcDoc={html} style={{ width: PAGE_W, height: PAGE_H, transform: `scale(${scale})`, transformOrigin: "top left" }} className="block" />
        </div>
      ) : (
        <div className="flex h-96 items-center justify-center text-sm text-muted-foreground">{t("previewLoading")}</div>
      )}
    </div>
  );
}
