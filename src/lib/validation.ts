import { z } from "zod";

export const optionalText = z
  .string()
  .trim()
  .transform((v) => (v === "" ? null : v))
  .nullable()
  .optional();

export const currencySchema = z.enum(["CZK", "EUR"]);
export const languageSchema = z.enum(["cs", "en"]);
export const vatRateSchema = z.coerce.number().int().refine((v) => [21, 12, 0].includes(v));

export const companySchema = z.object({
  name: z.string().trim().min(1),
  ico: optionalText,
  dic: optionalText,
  vatPayer: z.coerce.boolean(),
  street: optionalText,
  city: optionalText,
  zip: optionalText,
  country: z.string().trim().length(2).default("CZ"),
  email: z.string().trim().email().or(z.literal("")).transform((v) => v || null),
  phone: optionalText,
  web: optionalText,
  registrationNote: optionalText,
  defaultDueDays: z.coerce.number().int().min(0).max(365),
  defaultCurrency: currencySchema,
  footerText: optionalText,
});

export const numberingSchema = z.object({
  invoicePattern: z.string().trim().min(1),
  proformaPattern: z.string().trim().min(1),
});

export const bankAccountSchema = z.object({
  label: z.string().trim().min(1),
  accountNumber: optionalText,
  bankCode: optionalText,
  iban: optionalText,
  swift: optionalText,
  currency: currencySchema,
  isDefault: z.coerce.boolean(),
});

export const customerSchema = z.object({
  name: z.string().trim().min(1),
  ico: optionalText,
  dic: optionalText,
  street: optionalText,
  city: optionalText,
  zip: optionalText,
  country: z.string().trim().length(2).default("CZ"),
  email: z.string().trim().email().or(z.literal("")).transform((v) => v || null),
  phone: optionalText,
  language: languageSchema,
  currency: currencySchema,
  dueDays: z.union([z.literal(""), z.coerce.number().int().min(0).max(365)]).transform((v) => (v === "" ? null : v)),
  note: optionalText,
});

export const itemSchema = z.object({
  name: z.string().trim().min(1),
  description: optionalText,
  unit: z.string().trim().min(1).default("ks"),
  unitPrice: z.coerce.number().min(0),
  vatRate: vatRateSchema,
});

export function formToObject(fd: FormData) {
  const obj: Record<string, unknown> = {};
  for (const [k, v] of fd.entries()) obj[k] = v;
  return obj;
}

export type ActionResult = { ok: true } | { ok: false; error: string };
