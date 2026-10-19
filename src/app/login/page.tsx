import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { CheckCircle2, FileText } from "lucide-react";
import { getSession } from "@/lib/session";
import { LoginForm } from "./login-form";
import { LanguageSwitcher } from "@/components/language-switcher";

export default async function LoginPage() {
  const session = await getSession();
  if (session) redirect("/dashboard");
  const t = await getTranslations("login");
  const points = [t("point1"), t("point2"), t("point3")];
  return (
    <main className="flex min-h-screen">
      <section className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-primary p-12 text-primary-foreground lg:flex">
        <div className="absolute -top-24 -right-24 size-96 rounded-full bg-white/10" />
        <div className="absolute -bottom-32 -left-16 size-96 rounded-full bg-white/10" />
        <div className="relative flex items-center gap-2 text-lg font-semibold">
          <span className="flex size-8 items-center justify-center rounded-lg bg-white/20">
            <FileText className="size-4" />
          </span>
          Invoy
        </div>
        <div className="relative max-w-md space-y-6">
          <h2 className="font-heading text-3xl font-bold leading-tight">{t("heroTitle")}</h2>
          <ul className="space-y-3 text-sm/6 text-primary-foreground/90">
            {points.map((p) => (
              <li key={p} className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
                {p}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-xs text-primary-foreground/70">{t("footer")}</p>
      </section>
      <section className="flex flex-1 items-center justify-center px-4 py-16">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <div className="mb-6 flex items-center gap-2 font-semibold lg:hidden">
              <span className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <FileText className="size-4" />
              </span>
              Invoy
            </div>
            <h1 className="font-heading text-2xl font-bold">{t("title")}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>
          </div>
          <LoginForm />
          <div className="mt-6 flex justify-center">
            <LanguageSwitcher />
          </div>
        </div>
      </section>
    </main>
  );
}
