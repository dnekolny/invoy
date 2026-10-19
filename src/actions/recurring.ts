"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { recurringTemplate } from "@/db/schema";
import { requireCompany } from "@/lib/company";
import { lineInputSchema } from "@/lib/invoice-schema";
import { generateFromTemplate } from "@/lib/recurring";
import { todayIso } from "@/lib/dates";
import { currencySchema, type ActionResult } from "@/lib/validation";

const schema = z.object({
  name: z.string().trim().min(1),
  customerId: z.string().uuid(),
  type: z.enum(["invoice", "proforma"]),
  interval: z.enum(["weekly", "monthly", "quarterly", "yearly"]),
  nextDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  dueDays: z.coerce.number().int().min(0).max(365),
  currency: currencySchema,
  intro: z.string().trim().max(2000).nullable(),
  note: z.string().trim().max(2000).nullable(),
  autoIssue: z.boolean(),
  autoSend: z.boolean(),
  active: z.boolean(),
  lines: z.array(lineInputSchema).min(1),
});

export type RecurringInput = z.infer<typeof schema>;

export async function saveRecurringAction(id: string | null, raw: unknown): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const active = await requireCompany();
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const data = { ...parsed.data, lines: parsed.data.lines.map((l) => ({ ...l, vatRate: active.vatPayer ? l.vatRate : 0 })) };
  let rid = id;
  if (id) {
    await db.update(recurringTemplate).set(data).where(and(eq(recurringTemplate.id, id), eq(recurringTemplate.companyId, active.id)));
  } else {
    const [row] = await db.insert(recurringTemplate).values({ ...data, companyId: active.id }).returning({ id: recurringTemplate.id });
    rid = row.id;
  }
  revalidatePath("/recurring");
  return { ok: true, id: rid! };
}

export async function deleteRecurringAction(id: string): Promise<ActionResult> {
  const active = await requireCompany();
  await db.delete(recurringTemplate).where(and(eq(recurringTemplate.id, id), eq(recurringTemplate.companyId, active.id)));
  revalidatePath("/recurring");
  redirect("/recurring");
}

export async function runRecurringNowAction(id: string): Promise<{ ok: true; invoiceId: string } | { ok: false; error: string }> {
  const active = await requireCompany();
  const [tpl] = await db.select().from(recurringTemplate).where(and(eq(recurringTemplate.id, id), eq(recurringTemplate.companyId, active.id))).limit(1);
  if (!tpl) return { ok: false, error: "notfound" };
  try {
    const invoiceId = await generateFromTemplate(tpl, todayIso());
    revalidatePath("/recurring");
    revalidatePath("/invoices");
    return { ok: true, invoiceId };
  } catch (e) {
    return { ok: false, error: (e as Error).message.slice(0, 200) };
  }
}
