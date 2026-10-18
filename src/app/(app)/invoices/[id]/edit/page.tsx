import { asc, eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { db } from "@/db";
import { item } from "@/db/schema";
import { requireCompany } from "@/lib/company";
import { companyBankAccounts, companyCustomers, getInvoiceWithLines } from "@/lib/invoices";
import { InvoiceEditor } from "../../invoice-editor";

export default async function EditInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const active = await requireCompany();
  const inv = await getInvoiceWithLines(active.id, id);
  if (!inv) notFound();
  if (inv.status === "paid" || inv.status === "cancelled") redirect(`/invoices/${id}`);
  const [customers, bankAccounts, items] = await Promise.all([
    companyCustomers(active.id),
    companyBankAccounts(active.id),
    db.select().from(item).where(eq(item.companyId, active.id)).orderBy(asc(item.name)),
  ]);
  return <InvoiceEditor company={active} customers={customers} bankAccounts={bankAccounts} items={items} invoice={inv} />;
}
