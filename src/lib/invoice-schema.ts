import { z } from "zod";
import { INVOICE_TYPES } from "@/db/schema";
import { currencySchema, languageSchema, vatRateSchema } from "@/lib/validation";

export const lineInputSchema = z.object({
  name: z.string().trim().min(1),
  quantity: z.string().trim().regex(/^\d+([.,]\d{1,3})?$/).transform((v) => v.replace(",", ".")),
  unit: z.string().trim().max(20).default("ks"),
  unitPrice: z.string().trim().regex(/^-?\d+([.,]\d{1,2})?$/).transform((v) => v.replace(",", ".")),
  vatRate: vatRateSchema,
});

export const invoiceInputSchema = z.object({
  type: z.enum(INVOICE_TYPES),
  customerId: z.string().uuid().nullable(),
  issueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  taxDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  currency: currencySchema,
  language: languageSchema,
  bankAccountId: z.string().uuid().nullable(),
  intro: z.string().trim().max(2000).nullable(),
  note: z.string().trim().max(2000).nullable(),
  lines: z.array(lineInputSchema).min(1),
});

export type InvoiceInput = z.infer<typeof invoiceInputSchema>;
export type LineInput = z.infer<typeof lineInputSchema>;

export const paymentInputSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  amount: z.string().trim().regex(/^\d+([.,]\d{1,2})?$/).transform((v) => v.replace(",", ".")),
  note: z.string().trim().max(500).nullable(),
});
export type PaymentInput = z.infer<typeof paymentInputSchema>;
