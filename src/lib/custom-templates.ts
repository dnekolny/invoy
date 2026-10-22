import { desc, eq, isNotNull } from "drizzle-orm";
import { db } from "@/db";
import { customTemplate } from "@/db/schema";

export async function listCustomTemplates(companyId: string) {
  const rows = await db
    .select({ id: customTemplate.id, name: customTemplate.name, hasThumbnail: isNotNull(customTemplate.thumbnail), updatedAt: customTemplate.updatedAt })
    .from(customTemplate)
    .where(eq(customTemplate.companyId, companyId))
    .orderBy(desc(customTemplate.createdAt));
  return rows.map((r) => ({ id: r.id, name: r.name, thumbnailUrl: r.hasThumbnail ? `/api/templates/${r.id}/thumbnail?v=${r.updatedAt.getTime()}` : null }));
}
