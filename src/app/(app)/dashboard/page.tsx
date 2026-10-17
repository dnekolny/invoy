import Link from "next/link";
import { count, eq } from "drizzle-orm";
import { getTranslations } from "next-intl/server";
import { db } from "@/db";
import { bankAccount, customer, item } from "@/db/schema";
import { requireCompany } from "@/lib/company";
import { requireSession } from "@/lib/session";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function DashboardPage() {
  const session = await requireSession();
  const active = await requireCompany();
  const t = await getTranslations("dashboard");
  const [[c], [b], [i]] = await Promise.all([
    db.select({ n: count() }).from(customer).where(eq(customer.companyId, active.id)),
    db.select({ n: count() }).from(bankAccount).where(eq(bankAccount.companyId, active.id)),
    db.select({ n: count() }).from(item).where(eq(item.companyId, active.id)),
  ]);
  const cards = [
    { href: "/customers", title: t("customers"), value: c.n },
    { href: "/settings/bank-accounts", title: t("bankAccounts"), value: b.n },
    { href: "/settings/items", title: t("items"), value: i.n },
  ];
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("welcome", { name: session.user.name || session.user.email })}</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {cards.map((c) => (
          <Link key={c.href} href={c.href}>
            <Card className="transition-colors hover:bg-muted/50">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">{c.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-3xl font-semibold tabular-nums">{c.value}</CardContent>
            </Card>
          </Link>
        ))}
      </div>
      <p className="text-sm text-muted-foreground">{t("next")}</p>
    </div>
  );
}
