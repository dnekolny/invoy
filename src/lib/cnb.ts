export async function cnbRate(currency: string, date: Date): Promise<string | null> {
  if (currency === "CZK") return null;
  const d = `${String(date.getDate()).padStart(2, "0")}.${String(date.getMonth() + 1).padStart(2, "0")}.${date.getFullYear()}`;
  const res = await fetch(`https://www.cnb.cz/cs/financni-trhy/devizovy-trh/kurzy-devizoveho-trhu/kurzy-devizoveho-trhu/denni_kurz.txt?date=${d}`, {
    cache: "no-store",
  });
  if (!res.ok) return null;
  const text = await res.text();
  for (const line of text.split("\n").slice(2)) {
    const [, , amount, code, rate] = line.split("|");
    if (code === currency) {
      const perUnit = Number(rate.replace(",", ".")) / Number(amount);
      return perUnit.toFixed(4);
    }
  }
  return null;
}
