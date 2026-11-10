import { eq } from "drizzle-orm";
import { db } from "@/db";
import { emailChannel } from "@/db/schema";
import { requireCompany } from "@/lib/company";
import { listMailTemplates } from "@/lib/mail-resolve";
import { EmailChannelForm } from "./email-channel-form";
import { MailTemplates } from "./mail-templates";

export default async function EmailSettingsPage() {
  const active = await requireCompany();
  const [[ch], templates] = await Promise.all([db.select().from(emailChannel).where(eq(emailChannel.companyId, active.id)).limit(1), listMailTemplates(active.id)]);
  return (
    <div className="space-y-6">
      <EmailChannelForm
        channel={ch ? { ...ch, passwordEnc: "" } : null}
        defaults={{ fromName: active.name, fromEmail: active.email ?? "" }}
      />
      <MailTemplates templates={templates} />
    </div>
  );
}
