export function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export function addDays(iso: string, days: number) {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function addMonths(iso: string, months: number) {
  const d = new Date(iso + "T00:00:00Z");
  const day = d.getUTCDate();
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() + months);
  const last = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
  d.setUTCDate(Math.min(day, last));
  return d.toISOString().slice(0, 10);
}

export function isOverdue(inv: { status: string; dueDate: string }) {
  return (inv.status === "issued" || inv.status === "sent") && inv.dueDate < todayIso();
}

export function advance(iso: string, interval: string) {
  switch (interval) {
    case "weekly":
      return addDays(iso, 7);
    case "quarterly":
      return addMonths(iso, 3);
    case "yearly":
      return addMonths(iso, 12);
    default:
      return addMonths(iso, 1);
  }
}

export function daysOverdue(dueDate: string) {
  return Math.round((Date.parse(todayIso()) - Date.parse(dueDate)) / 86400000);
}
