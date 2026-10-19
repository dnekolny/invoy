import type { Invoice } from "@/db/schema";
import { daysOverdue } from "@/lib/dates";
import type { MailContext } from "@/lib/mail-templates";

export function mailContext(inv: Invoice, companyName: string): MailContext {
  const lang = inv.language === "en" ? "en" : "cs";
  const loc = lang === "cs" ? "cs-CZ" : "en-GB";
  return {
    number: inv.number ?? "",
    total: new Intl.NumberFormat(loc, { style: "currency", currency: inv.currency }).format(Number(inv.total)),
    dueDate: new Intl.DateTimeFormat(loc, { dateStyle: "medium" }).format(new Date(inv.dueDate + "T00:00:00")),
    company: companyName,
    customer: inv.customerName,
    link: `${process.env.BETTER_AUTH_URL}/i/${inv.publicToken}`,
    lang,
    type: inv.type,
    daysOverdue: Math.max(0, daysOverdue(inv.dueDate)),
  };
}
