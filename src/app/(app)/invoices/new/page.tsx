import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { item, type InvoiceType } from "@/db/schema";
import { requireCompany } from "@/lib/company";
import { companyCounters } from "@/lib/invoice-number";
import { companyBankAccounts, companyCustomers } from "@/lib/invoices";
import { InvoiceEditor } from "../invoice-editor";

export default async function NewInvoicePage({ searchParams }: { searchParams: Promise<{ type?: string; customer?: string }> }) {
  const sp = await searchParams;
  const active = await requireCompany();
  const [customers, bankAccounts, items, counters] = await Promise.all([
    companyCustomers(active.id),
    companyBankAccounts(active.id),
    db.select().from(item).where(eq(item.companyId, active.id)).orderBy(asc(item.name)),
    companyCounters(active.id),
  ]);
  return (
    <InvoiceEditor
      company={active}
      customers={customers}
      bankAccounts={bankAccounts}
      items={items}
      counters={counters}
      initialType={sp.type === "proforma" ? "proforma" : ("invoice" as InvoiceType)}
      initialCustomerId={sp.customer}
    />
  );
}
