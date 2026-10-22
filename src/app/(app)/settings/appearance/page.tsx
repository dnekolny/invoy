import { requireCompany } from "@/lib/company";
import { aiConfigured } from "@/lib/ai-template";
import { listCustomTemplates } from "@/lib/custom-templates";
import { AppearanceForm } from "./appearance-form";

export const maxDuration = 120;

export default async function AppearancePage() {
  const active = await requireCompany();
  const customTemplates = await listCustomTemplates(active.id);
  return (
    <AppearanceForm
      template={active.template}
      accentColor={active.accentColor}
      logoUrl={active.logoUrl}
      customTemplates={customTemplates}
      premium={active.premium}
      aiReady={aiConfigured()}
    />
  );
}
