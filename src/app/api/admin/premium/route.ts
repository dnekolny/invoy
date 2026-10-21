import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { company, user } from "@/db/schema";

const schema = z.object({ email: z.string().email(), premium: z.boolean() });

export async function POST(req: Request) {
  if (!process.env.CRON_SECRET || req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ ok: false, error: "invalid" }, { status: 400 });
  const [owner] = await db.select({ id: user.id }).from(user).where(eq(user.email, parsed.data.email.toLowerCase())).limit(1);
  if (!owner) return Response.json({ ok: false, error: "userNotFound" }, { status: 404 });
  const rows = await db.update(company).set({ premium: parsed.data.premium }).where(eq(company.ownerId, owner.id)).returning({ name: company.name });
  return Response.json({ ok: true, companies: rows.map((r) => r.name) });
}
