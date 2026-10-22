import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { customTemplate, type Company } from "@/db/schema";
import { htmlToJpeg } from "@/lib/pdf";
import { renderSampleInvoice } from "@/lib/sample-invoice";

const THUMB_WIDTH = 420;

export async function refreshTemplateThumbnail(active: Company, id: string, html: string) {
  try {
    const sample = await renderSampleInvoice(active, { customHtml: html });
    const jpeg = await htmlToJpeg(sample, THUMB_WIDTH);
    await db
      .update(customTemplate)
      .set({ thumbnail: Buffer.from(jpeg).toString("base64"), updatedAt: new Date() })
      .where(and(eq(customTemplate.id, id), eq(customTemplate.companyId, active.id)));
  } catch (e) {
    console.error("template thumbnail failed", e);
  }
}

export async function refreshAllTemplateThumbnails(active: Company) {
  const rows = await db.select({ id: customTemplate.id, html: customTemplate.html }).from(customTemplate).where(eq(customTemplate.companyId, active.id));
  for (const row of rows) await refreshTemplateThumbnail(active, row.id, row.html);
}
