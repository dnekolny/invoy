"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { item } from "@/db/schema";
import { requireCompany } from "@/lib/company";
import { formToObject, itemSchema, type ActionResult } from "@/lib/validation";

export async function saveItemAction(id: string | null, fd: FormData): Promise<ActionResult> {
  const active = await requireCompany();
  const parsed = itemSchema.safeParse(formToObject(fd));
  if (!parsed.success) return { ok: false, error: "invalid" };
  const data = { ...parsed.data, unitPrice: parsed.data.unitPrice.toFixed(2) };
  if (id) {
    await db.update(item).set(data).where(and(eq(item.id, id), eq(item.companyId, active.id)));
  } else {
    await db.insert(item).values({ ...data, companyId: active.id });
  }
  revalidatePath("/settings/items");
  return { ok: true };
}

export async function deleteItemAction(id: string): Promise<ActionResult> {
  const active = await requireCompany();
  await db.delete(item).where(and(eq(item.id, id), eq(item.companyId, active.id)));
  revalidatePath("/settings/items");
  return { ok: true };
}
