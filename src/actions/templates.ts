"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { company, customTemplate } from "@/db/schema";
import { AI_IMAGE_TYPES, aiConfigured, generateInvoiceTemplate, type AiImageType } from "@/lib/ai-template";
import { requireCompany } from "@/lib/company";
import { validateCustomTemplate } from "@/templates/custom";

const MAX_IMAGE = 5 * 1024 * 1024;

export async function generateTemplateAction(fd: FormData): Promise<{ ok: true; html: string } | { ok: false; error: string }> {
  const active = await requireCompany();
  if (!active.premium) return { ok: false, error: "premium" };
  if (!aiConfigured()) return { ok: false, error: "notConfigured" };
  const file = fd.get("image");
  const instructions = String(fd.get("instructions") ?? "").slice(0, 2000);
  const previousHtml = String(fd.get("previousHtml") ?? "").slice(0, 200_000) || undefined;
  const hasImage = file instanceof File && file.size > 0;
  if (hasImage && (!AI_IMAGE_TYPES.includes(file.type as AiImageType) || file.size > MAX_IMAGE)) return { ok: false, error: "image" };
  if (!hasImage && !previousHtml) return { ok: false, error: "image" };
  try {
    const html = await generateInvoiceTemplate({
      image: hasImage ? { data: Buffer.from(await file.arrayBuffer()).toString("base64"), mediaType: file.type as AiImageType } : undefined,
      instructions,
      previousHtml,
    });
    const problem = validateCustomTemplate(html);
    if (problem) return { ok: false, error: "incomplete" };
    return { ok: true, html };
  } catch (e) {
    console.error("ai template generation failed", e);
    return { ok: false, error: "ai" };
  }
}

const saveSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(1).max(60),
  html: z.string().min(50).max(200_000),
});

export async function saveCustomTemplateAction(raw: unknown): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const active = await requireCompany();
  if (!active.premium) return { ok: false, error: "premium" };
  const parsed = saveSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "invalid" };
  if (validateCustomTemplate(parsed.data.html)) return { ok: false, error: "incomplete" };
  let id = parsed.data.id;
  if (id) {
    const [row] = await db
      .update(customTemplate)
      .set({ name: parsed.data.name, html: parsed.data.html, updatedAt: new Date() })
      .where(and(eq(customTemplate.id, id), eq(customTemplate.companyId, active.id)))
      .returning({ id: customTemplate.id });
    if (!row) return { ok: false, error: "invalid" };
  } else {
    const [row] = await db.insert(customTemplate).values({ companyId: active.id, name: parsed.data.name, html: parsed.data.html }).returning({ id: customTemplate.id });
    id = row.id;
  }
  await db.update(company).set({ template: id, updatedAt: new Date() }).where(eq(company.id, active.id));
  revalidatePath("/settings/appearance");
  return { ok: true, id };
}

export async function getCustomTemplateHtml(id: string) {
  const active = await requireCompany();
  const [row] = await db.select({ html: customTemplate.html }).from(customTemplate).where(and(eq(customTemplate.id, id), eq(customTemplate.companyId, active.id))).limit(1);
  return row?.html ?? null;
}

export async function deleteCustomTemplateAction(id: string): Promise<{ ok: boolean }> {
  const active = await requireCompany();
  await db.delete(customTemplate).where(and(eq(customTemplate.id, id), eq(customTemplate.companyId, active.id)));
  if (active.template === id) await db.update(company).set({ template: "classic", updatedAt: new Date() }).where(eq(company.id, active.id));
  revalidatePath("/settings/appearance");
  return { ok: true };
}
