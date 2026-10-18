import ExcelJS from "exceljs";
import { requireCompany } from "@/lib/company";
import { effectiveStatus, listInvoices } from "@/lib/invoices";

const HEADERS = ["Číslo", "Typ", "Stav", "Odběratel", "IČO", "DIČ", "Vystaveno", "DUZP", "Splatnost", "Měna", "Základ", "DPH", "Celkem", "Uhrazeno", "Datum úhrady", "Kurz ČNB", "VS"];

export async function GET(req: Request) {
  const active = await requireCompany();
  const url = new URL(req.url);
  const year = Number(url.searchParams.get("year")) || new Date().getFullYear();
  const format = url.searchParams.get("format") === "csv" ? "csv" : "xlsx";
  const rows = (await listInvoices(active.id, { year })).filter((r) => r.status !== "draft");
  const data = rows.map((r) => [
    r.number ?? "", r.type === "proforma" ? "Zálohová" : "Faktura", effectiveStatus(r), r.customerName, r.customerIco ?? "", r.customerDic ?? "",
    r.issueDate, r.taxDate ?? "", r.dueDate, r.currency, Number(r.subtotal), Number(r.vatTotal), Number(r.total), Number(r.paidAmount), r.paidAt ?? "",
    r.exchangeRate ? Number(r.exchangeRate) : "", r.variableSymbol ?? "",
  ]);
  const name = `faktury-${year}`;
  if (format === "csv") {
    const csv = [HEADERS, ...data].map((row) => row.map((v) => (typeof v === "number" ? String(v).replace(".", ",") : `"${String(v).replace(/"/g, '""')}"`)).join(";")).join("\r\n");
    return new Response("﻿" + csv, { headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": `attachment; filename="${name}.csv"` } });
  }
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet(String(year));
  ws.addRow(HEADERS).font = { bold: true };
  for (const row of data) ws.addRow(row);
  ws.columns.forEach((c, i) => { c.width = i === 3 ? 32 : 14; });
  for (const col of [11, 12, 13, 14]) ws.getColumn(col).numFmt = "#,##0.00";
  const buf = await wb.xlsx.writeBuffer();
  return new Response(buf, { headers: { "content-type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "content-disposition": `attachment; filename="${name}.xlsx"` } });
}
