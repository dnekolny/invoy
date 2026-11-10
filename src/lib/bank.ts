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

function clean(v: string, max: number) {
  return v.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[*]/g, " ").slice(0, max);
}

const ymd = (iso: string) => iso.replace(/-/g, "");

export function spayd(p: { iban: string; bic?: string | null; amount: string; currency: string; vs?: string | null; message?: string | null; dueDate?: string | null; invoice?: string | null }) {
  const parts = [`SPD*1.0`, `ACC:${p.iban}${p.bic ? `+${p.bic}` : ""}`, `AM:${p.amount}`, `CC:${p.currency}`];
  if (p.vs) parts.push(`X-VS:${p.vs.replace(/\D/g, "").slice(0, 10)}`);
  if (p.dueDate) parts.push(`DT:${ymd(p.dueDate)}`);
  if (p.message) parts.push(`MSG:${clean(p.message, 60)}`);
  if (p.invoice) parts.push(`X-INV:${p.invoice.replace(/\*/g, "%2A")}`);
  return parts.join("*");
}

export type QrInvoiceInput = {
  number: string;
  issueDate: string;
  taxDate?: string | null;
  dueDate: string;
  total: string;
  currency: string;
  exchangeRate?: string | null;
  taxDocument: boolean;
  vs?: string | null;
  supplierDic?: string | null;
  supplierIco?: string | null;
  customerDic?: string | null;
  customerIco?: string | null;
  vatByRate?: { rate: number; base: string; vat: string }[];
};

export function qrInvoice(p: QrInvoiceInput) {
  const parts = ["SID*1.0", `ID:${clean(p.number, 40)}`, `DD:${ymd(p.issueDate)}`, `AM:${p.total}`];
  if (!p.taxDocument) parts.push("TD:0");
  if (p.vs) parts.push(`VS:${p.vs.replace(/\D/g, "").slice(0, 10)}`);
  const id = (v: string | null | undefined, max: number) => v?.replace(/\s/g, "").slice(0, max);
  const vii = id(p.supplierDic, 14), ini = id(p.supplierIco, 8), vir = id(p.customerDic, 14), inr = id(p.customerIco, 8);
  if (vii) parts.push(`VII:${vii}`);
  if (ini) parts.push(`INI:${ini}`);
  if (vir) parts.push(`VIR:${vir}`);
  if (inr) parts.push(`INR:${inr}`);
  if (p.taxDocument && p.taxDate) parts.push(`DUZP:${ymd(p.taxDate)}`);
  parts.push(`DT:${ymd(p.dueDate)}`);
  const fx = p.currency === "CZK" ? 1 : p.exchangeRate ? Number(p.exchangeRate) : null;
  if (p.taxDocument && fx && p.vatByRate?.length) {
    const czk = (v: string) => (Number(v) * fx).toFixed(2);
    const slot: Record<number, string> = { 21: "0", 12: "1", 15: "1", 10: "2" };
    let ntb = 0;
    for (const r of p.vatByRate) {
      const s = slot[r.rate];
      if (s === undefined) ntb += Number(r.base);
      else parts.push(`TB${s}:${czk(r.base)}`, `T${s}:${czk(r.vat)}`);
    }
    if (ntb) parts.push(`NTB:${(ntb * fx).toFixed(2)}`);
  }
  if (p.currency !== "CZK") {
    parts.push(`CC:${p.currency}`);
    if (p.exchangeRate) parts.push(`FX:${Number(p.exchangeRate).toFixed(3)}`);
  }
  return parts.join("*");
}
