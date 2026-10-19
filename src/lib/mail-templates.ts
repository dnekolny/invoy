export const MAIL_TOKENS = ["typ", "typ_mala", "cislo", "castka", "splatnost", "firma", "zakaznik", "odkaz"] as const;

export type MailContext = { number: string; total: string; dueDate: string; company: string; customer: string; link: string; lang: string; type: string };

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
  };
  return tpl.replace(/\{(\w+)\}/g, (m, k) => map[k] ?? m);
}
