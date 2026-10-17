import { and, asc, eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { company } from "@/db/schema";
import { requireSession } from "@/lib/session";

export const COMPANY_COOKIE = "companyId";

export async function getActiveCompany() {
  const session = await requireSession();
  const store = await cookies();
  const preferred = store.get(COMPANY_COOKIE)?.value;
  const companies = await db
    .select()
    .from(company)
    .where(eq(company.ownerId, session.user.id))
    .orderBy(asc(company.createdAt));
  if (companies.length === 0) return null;
  return companies.find((c) => c.id === preferred) ?? companies[0];
}

export async function requireCompany() {
  const active = await getActiveCompany();
  if (!active) redirect("/onboarding");
  return active;
}

export async function requireOwnedCompany(companyId: string) {
  const session = await requireSession();
  const [row] = await db
    .select()
    .from(company)
    .where(and(eq(company.id, companyId), eq(company.ownerId, session.user.id)))
    .limit(1);
  if (!row) throw new Error("Forbidden");
  return row;
}
