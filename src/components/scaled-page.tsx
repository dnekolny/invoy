"use client";

import { useEffect, useRef, useState } from "react";

const PAGE_W = 794;
const PAGE_H = 1123;

export function ScaledPage({ html, title }: { html: string; title: string }) {
  const box = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setScale(Math.min(1, entry.contentRect.width / PAGE_W)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={box} style={{ height: PAGE_H * scale }}>
      <iframe title={title} srcDoc={html} style={{ width: PAGE_W, height: PAGE_H, transform: `scale(${scale})`, transformOrigin: "top left" }} className="block" />
    </div>
  );
}
