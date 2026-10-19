import type { InvoiceType } from "@/db/schema";
import { formatNumber, patternYearly } from "@/lib/numbering";

export function peekNumber(counters: Record<string, number>, type: InvoiceType, pattern: string, issueDate: string) {
  const date = new Date(issueDate + "T00:00:00Z");
  const year = patternYearly(pattern) ? date.getUTCFullYear() : 0;
  return formatNumber(pattern, date, (counters[`${type}:${year}`] ?? 0) + 1);
}
