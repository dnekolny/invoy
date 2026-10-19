"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function CopyLink({ url }: { url: string }) {
  const t = useTranslations("invoiceDetail");
  const [done, setDone] = useState(false);
  async function copy() {
    await navigator.clipboard.writeText(url);
    setDone(true);
    toast.success(t("linkCopied"));
    setTimeout(() => setDone(false), 2000);
  }
  return (
    <Button type="button" variant="outline" size="sm" onClick={copy}>
      {done ? <Check /> : <Copy />}
      {t("copyLink")}
    </Button>
  );
}
