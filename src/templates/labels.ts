export const labels = {
  cs: {
    invoice: "Faktura", proforma: "Zálohová faktura", taxDoc: "Daňový doklad", proformaNote: "Zálohová faktura není daňovým dokladem. Daňový doklad bude vystaven po přijetí platby.",
    supplier: "Dodavatel", customer: "Odběratel", ico: "IČO", dic: "DIČ", notVatPayer: "Neplátce DPH",
    issueDate: "Datum vystavení", taxDate: "Datum zdanitelného plnění", dueDate: "Datum splatnosti", paymentMethod: "Forma úhrady", transfer: "Bankovním převodem",
    account: "Číslo účtu", iban: "IBAN", swift: "SWIFT", vs: "Variabilní symbol", qr: "QR platba",
    item: "Položka", qty: "Množství", unitPrice: "Cena / j.", vat: "DPH", net: "Bez DPH", total: "Celkem", base: "Základ", rate: "Sazba",
    vatSummary: "Rekapitulace DPH", subtotal: "Celkem bez DPH", vatTotal: "DPH celkem", totalDue: "Celkem k úhradě", paid: "Uhrazeno", remaining: "Zbývá uhradit",
    rate_cnb: "Kurz ČNB", vatInCzk: "DPH v CZK", note: "Poznámka", page: "Strana", cancelled: "STORNO", draft: "KONCEPT",
  },
  en: {
    invoice: "Invoice", proforma: "Proforma invoice", taxDoc: "Tax document", proformaNote: "This proforma invoice is not a tax document. A tax document will be issued upon payment.",
    supplier: "Supplier", customer: "Customer", ico: "Company ID", dic: "VAT ID", notVatPayer: "Not a VAT payer",
    issueDate: "Issue date", taxDate: "Date of taxable supply", dueDate: "Due date", paymentMethod: "Payment method", transfer: "Bank transfer",
    account: "Account number", iban: "IBAN", swift: "SWIFT", vs: "Variable symbol", qr: "QR payment",
    item: "Item", qty: "Qty", unitPrice: "Unit price", vat: "VAT", net: "Net", total: "Total", base: "Base", rate: "Rate",
    vatSummary: "VAT summary", subtotal: "Subtotal", vatTotal: "Total VAT", totalDue: "Total due", paid: "Paid", remaining: "Remaining",
    rate_cnb: "CNB exchange rate", vatInCzk: "VAT in CZK", note: "Note", page: "Page", cancelled: "CANCELLED", draft: "DRAFT",
  },
} as const;

export type Labels = Record<keyof (typeof labels)["cs"], string>;
export type TemplateId = "classic" | "modern";
export const TEMPLATES: { id: TemplateId; name: string }[] = [
  { id: "classic", name: "Classic" },
  { id: "modern", name: "Modern" },
];
