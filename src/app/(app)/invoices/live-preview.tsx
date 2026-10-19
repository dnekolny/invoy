"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";

export function LivePreview({ payload }: { payload: unknown }) {
  const t = useTranslations("invoiceEditor");
  const [html, setHtml] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const key = JSON.stringify(payload);
  const latest = useRef(key);

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
    <div className="relative overflow-hidden rounded-xl border bg-[#e9e9ec] dark:bg-black/40">
      {loading && (
        <div className="absolute top-2 right-2 z-10 flex items-center gap-1 rounded-md bg-card/90 px-2 py-1 text-xs text-muted-foreground shadow-sm">
          <Loader2 className="size-3 animate-spin" />
          {t("previewUpdating")}
        </div>
      )}
      {html ? (
        <iframe title={t("preview")} srcDoc={html} className="h-[1120px] w-full" />
      ) : (
        <div className="flex h-96 items-center justify-center text-sm text-muted-foreground">{t("previewLoading")}</div>
      )}
    </div>
  );
}
