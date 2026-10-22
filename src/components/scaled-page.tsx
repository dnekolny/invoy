"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const PAGE_W = 794;
const PAGE_H = 1123;

type Props = { title: string; html?: string; src?: string; fit?: "width" | "contain"; className?: string };

export function ScaledPage({ html, src, title, fit = "width", className }: Props) {
  const box = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setScale(Math.min(1, width / PAGE_W, fit === "contain" && height > 0 ? height / PAGE_H : 1));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [fit]);

  return (
    <div ref={box} className={cn(fit === "contain" && "flex h-full w-full justify-center", className)} style={fit === "width" ? { height: PAGE_H * scale } : undefined}>
      <div style={{ width: PAGE_W * scale, height: PAGE_H * scale }}>
        <iframe title={title} srcDoc={html} src={src} loading={src ? "lazy" : undefined} style={{ width: PAGE_W, height: PAGE_H, transform: `scale(${scale})`, transformOrigin: "top left" }} className="block bg-white" />
      </div>
    </div>
  );
}
