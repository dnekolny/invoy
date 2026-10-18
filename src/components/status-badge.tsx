import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const styles: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  issued: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200",
  sent: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-200",
  paid: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200",
  overdue: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200",
  cancelled: "bg-muted text-muted-foreground line-through",
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const t = useTranslations("status");
  return (
    <Badge variant="secondary" className={cn("border-0 font-medium", styles[status], className)}>
      {t(status)}
    </Badge>
  );
}
