export type AresResult = {
  name: string;
  ico: string;
  dic: string | null;
  street: string | null;
  city: string | null;
  zip: string | null;
};

type AresSubject = {
  obchodniJmeno?: string;
  ico?: string;
  dic?: string;
  sidlo?: {
    nazevUlice?: string;
    cisloDomovni?: number;
    cisloOrientacni?: number;
    cisloOrientacniPismeno?: string;
    nazevObce?: string;
    nazevCastiObce?: string;
    psc?: number;
  };
};

export async function lookupAres(ico: string): Promise<AresResult | null> {
  const clean = ico.replace(/\s/g, "");
  if (!/^\d{8}$/.test(clean)) return null;
  const res = await fetch(`https://ares.gov.cz/ekonomicke-subjekty-v-be/rest/ekonomicke-subjekty/${clean}`, {
    headers: { accept: "application/json" },
    cache: "no-store",
  });
  if (!res.ok) return null;
  const s = (await res.json()) as AresSubject;
  if (!s.obchodniJmeno) return null;
  const a = s.sidlo ?? {};
  const number = [a.cisloDomovni, a.cisloOrientacni ? `${a.cisloOrientacni}${a.cisloOrientacniPismeno ?? ""}` : null]
    .filter(Boolean)
    .join("/");
  const streetName = a.nazevUlice ?? a.nazevCastiObce ?? a.nazevObce ?? "";
  return {
    name: s.obchodniJmeno,
    ico: s.ico ?? clean,
    dic: s.dic ?? null,
    street: [streetName, number].filter(Boolean).join(" ") || null,
    city: a.nazevObce ?? null,
    zip: a.psc ? String(a.psc) : null,
  };
}
