export const MAIL_TOKENS = ["typ", "typ_mala", "cislo", "castka", "splatnost", "firma", "zakaznik", "odkaz"] as const;
export const REMINDER_TOKENS = [...MAIL_TOKENS, "dni"] as const;

export type MailContext = { number: string; total: string; dueDate: string; company: string; customer: string; link: string; lang: string; type: string; daysOverdue?: number };

export const defaultTemplates = {
  cs: {
    subject: "{typ} {cislo} – {firma}",
    body: "Dobrý den,\n\nv příloze zasíláme {typ_mala} {cislo} na částku {castka} se splatností {splatnost}.\nFakturu si můžete zobrazit i online: {odkaz}\n\nDěkujeme a přejeme hezký den,\n{firma}",
  },
  en: {
    subject: "{typ} {cislo} – {firma}",
    body: "Hello,\n\nplease find attached {typ_mala} {cislo} for {castka}, due on {splatnost}.\nYou can also view it online: {odkaz}\n\nThank you,\n{firma}",
  },
};

export const defaultReminderTemplates = {
  cs: {
    subject: "Připomenutí: {typ_mala} {cislo} po splatnosti – {firma}",
    body: "Dobrý den,\n\ndovolujeme si připomenout, že {typ_mala} {cislo} na částku {castka} byla splatná {splatnost} a zatím jsme neobdrželi platbu ({dni} dní po splatnosti).\nFakturu najdete v příloze nebo online: {odkaz}\n\nPokud jste již platbu odeslali, považujte prosím tento e-mail za bezpředmětný.\n\nDěkujeme,\n{firma}",
  },
  en: {
    subject: "Reminder: {typ_mala} {cislo} is overdue – {firma}",
    body: "Hello,\n\nthis is a friendly reminder that {typ_mala} {cislo} for {castka} was due on {splatnost} and we have not received the payment yet ({dni} days overdue).\nThe invoice is attached and available online: {odkaz}\n\nIf you have already paid, please ignore this message.\n\nThank you,\n{firma}",
  },
};

export function fillTemplate(tpl: string, ctx: MailContext) {
  const typeName = ctx.lang === "en" ? (ctx.type === "proforma" ? "Proforma invoice" : "Invoice") : ctx.type === "proforma" ? "Zálohová faktura" : "Faktura";
  const map: Record<string, string> = {
    typ: typeName,
    typ_mala: typeName.toLowerCase(),
    cislo: ctx.number,
    castka: ctx.total,
    splatnost: ctx.dueDate,
    firma: ctx.company,
    zakaznik: ctx.customer,
    odkaz: ctx.link,
    dni: String(ctx.daysOverdue ?? 0),
  };
  return tpl.replace(/\{(\w+)\}/g, (m, k) => map[k] ?? m);
}

export function parseReminderDays(v: string) {
  return [...new Set(v.split(/[,\s]+/).filter(Boolean).map((x) => Number(x)).filter((n) => Number.isInteger(n) && n >= 1 && n <= 365))].sort((a, b) => a - b).slice(0, 5);
}
