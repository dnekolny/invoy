"use client";

import { useTranslations } from "next-intl";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export function ExportMenu({ year }: { year?: number }) {
  const t = useTranslations("invoices");
  const y = year ?? new Date().getFullYear();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="ghost" size="sm" />}>
        <Download />
        {t("export")}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem render={<a href={`/api/export?year=${y}&format=xlsx`} />}>{t("exportXlsx", { year: y })}</DropdownMenuItem>
        <DropdownMenuItem render={<a href={`/api/export?year=${y}&format=csv`} />}>{t("exportCsv", { year: y })}</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
