import { requireCompany } from "@/lib/company";
import { NumberingForm } from "./numbering-form";

export default async function NumberingPage() {
  const active = await requireCompany();
  return <NumberingForm invoicePattern={active.invoicePattern} proformaPattern={active.proformaPattern} />;
}
