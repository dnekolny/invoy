import Decimal from "decimal.js";

export type LineInput = { quantity: string | number; unitPrice: string | number; vatRate: number };

export function round2(v: Decimal.Value) {
  return new Decimal(v).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
}

export function computeLine(l: LineInput) {
  const net = round2(new Decimal(l.quantity || 0).mul(l.unitPrice || 0));
  const vat = round2(net.mul(l.vatRate).div(100));
  return { net, vat, gross: net.plus(vat) };
}

export function computeTotals(lines: LineInput[], vatPayer: boolean) {
  let subtotal = new Decimal(0);
  let vatTotal = new Decimal(0);
  const byRate = new Map<number, { base: Decimal; vat: Decimal }>();
  for (const l of lines) {
    const { net, vat } = computeLine({ ...l, vatRate: vatPayer ? l.vatRate : 0 });
    subtotal = subtotal.plus(net);
    vatTotal = vatTotal.plus(vat);
    const rate = vatPayer ? l.vatRate : 0;
    const acc = byRate.get(rate) ?? { base: new Decimal(0), vat: new Decimal(0) };
    byRate.set(rate, { base: acc.base.plus(net), vat: acc.vat.plus(vat) });
  }
  return {
    subtotal,
    vatTotal,
    total: subtotal.plus(vatTotal),
    byRate: [...byRate.entries()].sort((a, b) => b[0] - a[0]).map(([rate, v]) => ({ rate, ...v })),
  };
}

export function toDb(v: Decimal.Value) {
  return new Decimal(v).toFixed(2);
}
