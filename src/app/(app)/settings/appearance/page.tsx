import { requireCompany } from "@/lib/company";
import { AppearanceForm } from "./appearance-form";

export default async function AppearancePage() {
  const active = await requireCompany();
  return <AppearanceForm template={active.template} accentColor={active.accentColor} logoUrl={active.logoUrl} />;
}
