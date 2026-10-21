import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { customTemplate } from "@/db/schema";

export async function listCustomTemplates(companyId: string) {
  return db.select({ id: customTemplate.id, name: customTemplate.name }).from(customTemplate).where(eq(customTemplate.companyId, companyId)).orderBy(desc(customTemplate.createdAt));
}
