"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export function LoadingBar({ active, className }: { active: boolean; className?: string }) {
  if (!active) return null;
  return (
    <div role="progressbar" aria-busy="true" data-loading-bar className={cn("pointer-events-none absolute inset-x-0 top-0 z-20 h-1 overflow-hidden bg-primary/15", className)}>
      <div className="h-full w-2/5 rounded-full bg-primary" style={{ animation: "loading-bar 1.1s ease-in-out infinite" }} />
    </div>
  );
}

export function PreviewFrame({ src, title, className, label }: { src: string; title: string; className?: string; label?: string }) {
  const ref = useRef<HTMLIFrameElement>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const doc = ref.current?.contentDocument;
    if (doc && doc.readyState === "complete" && doc.URL !== "about:blank") setLoading(false);
  }, []);

  return (
    <div className="relative">
      <LoadingBar active={loading} />
      {loading && label && <div className="pointer-events-none absolute inset-x-0 top-24 z-10 text-center text-sm text-muted-foreground">{label}</div>}
      <iframe ref={ref} title={title} src={src} className={cn(className, "transition-opacity", loading && "opacity-0")} onLoad={() => setLoading(false)} />
    </div>
  );
}
