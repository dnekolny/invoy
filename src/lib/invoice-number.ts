import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { numberingCounter, type InvoiceType } from "@/db/schema";
import { formatNumber, patternYearly } from "@/lib/numbering";

export async function nextInvoiceNumber(companyId: string, type: InvoiceType, pattern: string, issueDate: string) {
  const date = new Date(issueDate + "T00:00:00Z");
  const year = patternYearly(pattern) ? date.getUTCFullYear() : 0;
  const [row] = await db
    .insert(numberingCounter)
    .values({ companyId, series: type, year, last: 1 })
    .onConflictDoUpdate({
      target: [numberingCounter.companyId, numberingCounter.series, numberingCounter.year],
      set: { last: sql`${numberingCounter.last} + 1` },
    })
    .returning({ last: numberingCounter.last });
  return formatNumber(pattern, date, row.last);
}

export async function companyCounters(companyId: string) {
  const rows = await db.select({ series: numberingCounter.series, year: numberingCounter.year, last: numberingCounter.last }).from(numberingCounter).where(eq(numberingCounter.companyId, companyId));
  return Object.fromEntries(rows.map((r) => [`${r.series}:${r.year}`, r.last])) as Record<string, number>;
}
