"use client";

import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { setLocale } from "@/i18n/actions";
import { locales, type Locale } from "@/i18n/config";
import { Button } from "@/components/ui/button";

export function LanguageSwitcher() {
  const current = useLocale();
  const router = useRouter();
  const [pending, start] = useTransition();

  function change(locale: Locale) {
    start(async () => {
      await setLocale(locale);
      router.refresh();
    });
  }

  return (
    <div className="flex gap-0.5">
      {locales.map((l) => (
        <Button
          key={l}
          size="sm"
          variant={l === current ? "secondary" : "ghost"}
          disabled={pending}
          onClick={() => change(l)}
          className="px-2 text-xs uppercase"
        >
          {l}
        </Button>
      ))}
    </div>
  );
}
