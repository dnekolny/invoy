"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { bankAccount } from "@/db/schema";
import { requireCompany } from "@/lib/company";
import { bankAccountSchema, formToObject, type ActionResult } from "@/lib/validation";

export async function saveBankAccountAction(id: string | null, fd: FormData): Promise<ActionResult> {
  const active = await requireCompany();
  const parsed = bankAccountSchema.safeParse(formToObject(fd));
  if (!parsed.success) return { ok: false, error: "invalid" };
  const data = parsed.data;
  if (data.isDefault) {
    await db.update(bankAccount).set({ isDefault: false }).where(eq(bankAccount.companyId, active.id));
  }
  if (id) {
    await db
      .update(bankAccount)
      .set(data)
      .where(and(eq(bankAccount.id, id), eq(bankAccount.companyId, active.id)));
  } else {
    await db.insert(bankAccount).values({ ...data, companyId: active.id });
  }
  revalidatePath("/settings/bank-accounts");
  return { ok: true };
}

export async function deleteBankAccountAction(id: string): Promise<ActionResult> {
  const active = await requireCompany();
  await db.delete(bankAccount).where(and(eq(bankAccount.id, id), eq(bankAccount.companyId, active.id)));
  revalidatePath("/settings/bank-accounts");
  return { ok: true };
}
