"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { customer, type Customer } from "@/db/schema";
import { requireCompany } from "@/lib/company";
import { customerSchema, formToObject, type ActionResult } from "@/lib/validation";

export async function saveCustomerAction(id: string | null, fd: FormData): Promise<ActionResult> {
  const active = await requireCompany();
  const parsed = customerSchema.safeParse(formToObject(fd));
  if (!parsed.success) return { ok: false, error: "invalid" };
  if (id) {
    await db
      .update(customer)
      .set({ ...parsed.data, updatedAt: new Date() })
      .where(and(eq(customer.id, id), eq(customer.companyId, active.id)));
  } else {
    await db.insert(customer).values({ ...parsed.data, companyId: active.id });
  }
  revalidatePath("/customers");
  redirect("/customers");
}

export async function deleteCustomerAction(id: string): Promise<ActionResult> {
  const active = await requireCompany();
  await db.delete(customer).where(and(eq(customer.id, id), eq(customer.companyId, active.id)));
  revalidatePath("/customers");
  redirect("/customers");
}

export async function createCustomerInlineAction(fd: FormData): Promise<{ ok: true; customer: Customer } | { ok: false; error: string }> {
  const active = await requireCompany();
  const parsed = customerSchema.safeParse(formToObject(fd));
  if (!parsed.success) return { ok: false, error: "invalid" };
  const [row] = await db.insert(customer).values({ ...parsed.data, companyId: active.id }).returning();
  revalidatePath("/customers");
  return { ok: true, customer: row };
}
