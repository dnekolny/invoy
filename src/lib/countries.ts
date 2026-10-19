export type Country = { code: string; name: string; prefix: string; currency: "CZK" | "EUR"; language: "cs" | "en" };

export const COUNTRIES: Country[] = [
  { code: "CZ", name: "Česká republika", prefix: "+420", currency: "CZK", language: "cs" },
  { code: "SK", name: "Slovensko", prefix: "+421", currency: "EUR", language: "cs" },
  { code: "DE", name: "Deutschland", prefix: "+49", currency: "EUR", language: "en" },
  { code: "AT", name: "Österreich", prefix: "+43", currency: "EUR", language: "en" },
  { code: "PL", name: "Polska", prefix: "+48", currency: "EUR", language: "en" },
  { code: "HU", name: "Magyarország", prefix: "+36", currency: "EUR", language: "en" },
  { code: "GB", name: "United Kingdom", prefix: "+44", currency: "EUR", language: "en" },
  { code: "IE", name: "Ireland", prefix: "+353", currency: "EUR", language: "en" },
  { code: "NL", name: "Nederland", prefix: "+31", currency: "EUR", language: "en" },
  { code: "BE", name: "België", prefix: "+32", currency: "EUR", language: "en" },
  { code: "FR", name: "France", prefix: "+33", currency: "EUR", language: "en" },
  { code: "IT", name: "Italia", prefix: "+39", currency: "EUR", language: "en" },
  { code: "ES", name: "España", prefix: "+34", currency: "EUR", language: "en" },
  { code: "CH", name: "Schweiz", prefix: "+41", currency: "EUR", language: "en" },
  { code: "US", name: "United States", prefix: "+1", currency: "EUR", language: "en" },
];

export const PHONE_PREFIXES = [...new Set(COUNTRIES.map((c) => c.prefix))].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

export function countryByCode(code: string | null | undefined) {
  return COUNTRIES.find((c) => c.code === code) ?? COUNTRIES[0];
}

export function splitPhone(value: string | null | undefined, fallbackPrefix = "+420") {
  const v = (value ?? "").trim();
  if (!v) return { prefix: fallbackPrefix, number: "" };
  const m = v.match(/^(\+\d{1,3})\s*(.*)$/);
  if (m && PHONE_PREFIXES.includes(m[1])) return { prefix: m[1], number: m[2].trim() };
  if (m) return { prefix: m[1], number: m[2].trim() };
  return { prefix: fallbackPrefix, number: v };
}

export function joinPhone(prefix: string, number: string) {
  const n = number.replace(/[^\d\s]/g, "").trim().replace(/^0+/, "");
  return n ? `${prefix} ${n}` : "";
}
