import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { customTemplate } from "@/db/schema";
import { requireCompany } from "@/lib/company";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  if (!/^[0-9a-f-]{36}$/.test(id)) return new Response("Not found", { status: 404 });
  const active = await requireCompany();
  const [row] = await db.select({ thumbnail: customTemplate.thumbnail }).from(customTemplate).where(and(eq(customTemplate.id, id), eq(customTemplate.companyId, active.id))).limit(1);
  if (!row?.thumbnail) return new Response("Not found", { status: 404 });
  return new Response(Buffer.from(row.thumbnail, "base64"), { headers: { "content-type": "image/jpeg", "cache-control": "private, max-age=31536000, immutable" } });
}
