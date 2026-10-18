import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { item, type InvoiceType } from "@/db/schema";
import { requireCompany } from "@/lib/company";
import { companyBankAccounts, companyCustomers } from "@/lib/invoices";
import { InvoiceEditor } from "../invoice-editor";

export default async function NewInvoicePage({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
  const { type } = await searchParams;
  const active = await requireCompany();
  const [customers, bankAccounts, items] = await Promise.all([
    companyCustomers(active.id),
    companyBankAccounts(active.id),
    db.select().from(item).where(eq(item.companyId, active.id)).orderBy(asc(item.name)),
  ]);
  return <InvoiceEditor company={active} customers={customers} bankAccounts={bankAccounts} items={items} initialType={type === "proforma" ? "proforma" : ("invoice" as InvoiceType)} />;
}
