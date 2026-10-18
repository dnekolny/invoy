import { eq } from "drizzle-orm";
import { db } from "@/db";
import { emailChannel } from "@/db/schema";
import { requireCompany } from "@/lib/company";
import { EmailChannelForm } from "./email-channel-form";

export default async function EmailSettingsPage() {
  const active = await requireCompany();
  const [ch] = await db.select().from(emailChannel).where(eq(emailChannel.companyId, active.id)).limit(1);
  return (
    <EmailChannelForm
      channel={ch ? { ...ch, passwordEnc: "" } : null}
      defaults={{ fromName: active.name, fromEmail: active.email ?? "" }}
    />
  );
}
