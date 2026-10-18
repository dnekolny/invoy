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
    textovaAdresa?: string;
  };
};

const BASE = "https://ares.gov.cz/ekonomicke-subjekty-v-be/rest/ekonomicke-subjekty";

function mapSubject(s: AresSubject, fallbackIco = ""): AresResult | null {
  if (!s.obchodniJmeno) return null;
  const a = s.sidlo ?? {};
  const number = [a.cisloDomovni, a.cisloOrientacni ? `${a.cisloOrientacni}${a.cisloOrientacniPismeno ?? ""}` : null]
    .filter(Boolean)
    .join("/");
  const streetName = a.nazevUlice ?? a.nazevCastiObce ?? a.nazevObce ?? "";
  const street = [streetName, number].filter(Boolean).join(" ") || a.textovaAdresa?.split(",")[0] || null;
  return {
    name: s.obchodniJmeno,
    ico: s.ico ?? fallbackIco,
    dic: s.dic ?? null,
    street,
    city: a.nazevObce ?? null,
    zip: a.psc ? String(a.psc) : null,
  };
}

export async function lookupAres(ico: string): Promise<AresResult | null> {
  const clean = ico.replace(/\s/g, "");
  if (!/^\d{8}$/.test(clean)) return null;
  const res = await fetch(`${BASE}/${clean}`, { headers: { accept: "application/json" }, cache: "no-store" });
  if (!res.ok) return null;
  return mapSubject((await res.json()) as AresSubject, clean);
}

export async function searchAres(query: string): Promise<AresResult[]> {
  const q = query.trim();
  if (q.length < 3) return [];
  if (/^\d{8}$/.test(q)) {
    const one = await lookupAres(q);
    return one ? [one] : [];
  }
  const res = await fetch(`${BASE}/vyhledat`, {
    method: "POST",
    headers: { accept: "application/json", "content-type": "application/json" },
    body: JSON.stringify({ obchodniJmeno: q, pocet: 10, start: 0 }),
    cache: "no-store",
  });
  if (!res.ok) return [];
  const data = (await res.json()) as { ekonomickeSubjekty?: AresSubject[] };
  return (data.ekonomickeSubjekty ?? []).map((s) => mapSubject(s)).filter((r): r is AresResult => r !== null);
}
