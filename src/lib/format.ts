export function formatMoney(value: string | number, currency: string, locale: string) {
  return new Intl.NumberFormat(locale === "cs" ? "cs-CZ" : "en-GB", { style: "currency", currency }).format(Number(value));
}

export function formatDate(date: Date | string, locale: string) {
  return new Intl.DateTimeFormat(locale === "cs" ? "cs-CZ" : "en-GB", { dateStyle: "medium" }).format(new Date(date));
}
