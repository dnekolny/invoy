function mod97(numeric: string) {
  let remainder = 0;
  for (const ch of numeric) remainder = (remainder * 10 + Number(ch)) % 97;
  return remainder;
}

export function czechIban(accountNumber: string, bankCode: string): string | null {
  const m = accountNumber.replace(/\s/g, "").match(/^(?:(\d{1,6})-)?(\d{2,10})$/);
  if (!m || !/^\d{4}$/.test(bankCode)) return null;
  const prefix = (m[1] ?? "").padStart(6, "0");
  const number = m[2].padStart(10, "0");
  const bban = `${bankCode}${prefix}${number}`;
  const check = 98 - mod97(`${bban}123500`);
  return `CZ${String(check).padStart(2, "0")}${bban}`;
}

export function resolveIban(acc: { iban: string | null; accountNumber: string | null; bankCode: string | null }) {
  if (acc.iban) return acc.iban.replace(/\s/g, "").toUpperCase();
  if (acc.accountNumber && acc.bankCode) return czechIban(acc.accountNumber, acc.bankCode);
  return null;
}

export function spayd(p: { iban: string; bic?: string | null; amount: string; currency: string; vs?: string | null; message?: string | null; dueDate?: string | null }) {
  const parts = [`SPD*1.0`, `ACC:${p.iban}${p.bic ? `+${p.bic}` : ""}`, `AM:${p.amount}`, `CC:${p.currency}`];
  if (p.vs) parts.push(`X-VS:${p.vs.replace(/\D/g, "").slice(0, 10)}`);
  if (p.dueDate) parts.push(`DT:${p.dueDate.replace(/-/g, "")}`);
  if (p.message) parts.push(`MSG:${p.message.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[*]/g, " ").slice(0, 60)}`);
  return parts.join("*");
}
