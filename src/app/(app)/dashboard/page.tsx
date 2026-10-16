import { getTranslations } from "next-intl/server";
import { requireSession } from "@/lib/session";

export default async function DashboardPage() {
  const session = await requireSession();
  const t = await getTranslations("dashboard");
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">{t("title")}</h1>
      <p>{t("welcome", { name: session.user.name || session.user.email })}</p>
      <p className="text-sm text-muted-foreground">{t("empty")}</p>
    </div>
  );
}
