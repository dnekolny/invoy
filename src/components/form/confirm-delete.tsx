"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import type { ActionResult } from "@/lib/validation";

type Props = { action: () => Promise<ActionResult>; title: string; description?: string };

export function ConfirmDelete({ action, title, description }: Props) {
  const t = useTranslations("common");
  const [pending, start] = useTransition();
  return (
    <AlertDialog>
      <AlertDialogTrigger render={<Button variant="ghost" size="icon-sm" aria-label={t("delete")} />}>
        <Trash2 />
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {description && <AlertDialogDescription>{description}</AlertDialogDescription>}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
          <AlertDialogAction
            disabled={pending}
            onClick={() =>
              start(async () => {
                const r = await action();
                if (!r.ok) toast.error(t("error"));
              })
            }
          >
            {t("delete")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
