"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { company } from "@/db/schema";
import { requireCompany } from "@/lib/company";
import { isValidPattern } from "@/lib/numbering";
import { requireSession } from "@/lib/session";
import { companySchema, formToObject, numberingSchema, type ActionResult } from "@/lib/validation";

export async function createCompanyAction(fd: FormData): Promise<ActionResult> {
  const session = await requireSession();
  const parsed = companySchema.safeParse(formToObject(fd));
  if (!parsed.success) return { ok: false, error: "invalid" };
  await db.insert(company).values({ ...parsed.data, ownerId: session.user.id });
  redirect("/dashboard");
}

export async function updateCompanyAction(fd: FormData): Promise<ActionResult> {
  const active = await requireCompany();
  const parsed = companySchema.safeParse(formToObject(fd));
  if (!parsed.success) return { ok: false, error: "invalid" };
  await db.update(company).set({ ...parsed.data, updatedAt: new Date() }).where(eq(company.id, active.id));
  revalidatePath("/settings");
  return { ok: true };
}

export async function updateNumberingAction(fd: FormData): Promise<ActionResult> {
  const active = await requireCompany();
  const parsed = numberingSchema.safeParse(formToObject(fd));
  if (!parsed.success) return { ok: false, error: "invalid" };
  if (!isValidPattern(parsed.data.invoicePattern) || !isValidPattern(parsed.data.proformaPattern)) {
    return { ok: false, error: "pattern" };
  }
  await db.update(company).set({ ...parsed.data, updatedAt: new Date() }).where(eq(company.id, active.id));
  revalidatePath("/settings/numbering");
  return { ok: true };
}
