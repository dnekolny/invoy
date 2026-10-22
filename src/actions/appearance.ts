"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { company, customTemplate } from "@/db/schema";
import { requireCompany } from "@/lib/company";
import { refreshAllTemplateThumbnails } from "@/lib/template-thumbnail";
import type { ActionResult } from "@/lib/validation";

const schema = z.object({
  template: z.string().min(1).max(40),
  accentColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  logoUrl: z.string().max(400_000).regex(/^data:image\/(png|jpeg|webp|svg\+xml);base64,/).nullable(),
});

export async function saveAppearanceAction(raw: unknown): Promise<ActionResult> {
  const active = await requireCompany();
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "invalid" };
  if (!["classic", "modern"].includes(parsed.data.template)) {
    const [row] = await db.select({ id: customTemplate.id }).from(customTemplate).where(and(eq(customTemplate.id, parsed.data.template), eq(customTemplate.companyId, active.id))).limit(1);
    if (!row) return { ok: false, error: "invalid" };
  }
  await db.update(company).set({ ...parsed.data, updatedAt: new Date() }).where(eq(company.id, active.id));
  if (parsed.data.accentColor !== active.accentColor || parsed.data.logoUrl !== active.logoUrl) {
    after(() => refreshAllTemplateThumbnails({ ...active, ...parsed.data }));
  }
  revalidatePath("/settings/appearance");
  return { ok: true };
}
