import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ArrowLeft } from "lucide-react";
import { saveCustomerAction } from "@/actions/customers";
import { requireCompany } from "@/lib/company";
import { CustomerForm } from "../customer-form";

export default async function NewCustomerPage() {
  const active = await requireCompany();
  const t = await getTranslations("customers");
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link href="/customers" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-3.5" />
        {t("backToList")}
      </Link>
      <div>
        <h1 className="text-2xl font-semibold">{t("newTitle")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("newSubtitle")}</p>
      </div>
      <CustomerForm action={saveCustomerAction.bind(null, null)} defaultCurrency={active.defaultCurrency} />
    </div>
  );
}
