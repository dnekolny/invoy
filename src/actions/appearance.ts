"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { company } from "@/db/schema";
import { requireCompany } from "@/lib/company";
import type { ActionResult } from "@/lib/validation";

const schema = z.object({
  template: z.enum(["classic", "modern"]),
  accentColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  logoUrl: z.string().max(400_000).regex(/^data:image\/(png|jpeg|webp|svg\+xml);base64,/).nullable(),
});

export async function saveAppearanceAction(raw: unknown): Promise<ActionResult> {
  const active = await requireCompany();
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "invalid" };
  await db.update(company).set({ ...parsed.data, updatedAt: new Date() }).where(eq(company.id, active.id));
  revalidatePath("/settings/appearance");
  return { ok: true };
}
