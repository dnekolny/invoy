"use client";

import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";
import { Switch } from "@/components/ui/switch";

export const THEME_SCRIPT = `(function(){try{var t=localStorage.getItem("theme");if(t==="dark"||(!t&&matchMedia("(prefers-color-scheme: dark)").matches))document.documentElement.classList.add("dark")}catch(e){}})()`;

function subscribe(cb: () => void) {
  const obs = new MutationObserver(cb);
  obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  return () => obs.disconnect();
}

export function ThemeToggle({ label }: { label: string }) {
  const dark = useSyncExternalStore(subscribe, () => document.documentElement.classList.contains("dark"), () => false);
  function change(v: boolean) {
    document.documentElement.classList.toggle("dark", v);
    try {
      localStorage.setItem("theme", v ? "dark" : "light");
    } catch {}
  }
  return (
    <label className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-sidebar-accent hover:text-foreground">
      {dark ? <Moon className="size-4" /> : <Sun className="size-4" />}
      <span className="flex-1">{label}</span>
      <Switch checked={dark} onCheckedChange={change} aria-label={label} />
    </label>
  );
}
