import { boolean, integer, numeric, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});


export const company = pgTable("company", {
  id: uuid("id").primaryKey().defaultRandom(),
  ownerId: text("owner_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  ico: text("ico"),
  dic: text("dic"),
  vatPayer: boolean("vat_payer").notNull().default(false),
  street: text("street"),
  city: text("city"),
  zip: text("zip"),
  country: text("country").notNull().default("CZ"),
  email: text("email"),
  phone: text("phone"),
  web: text("web"),
  registrationNote: text("registration_note"),
  logoUrl: text("logo_url"),
  defaultDueDays: integer("default_due_days").notNull().default(14),
  defaultCurrency: text("default_currency").notNull().default("CZK"),
  invoicePattern: text("invoice_pattern").notNull().default("{YYYY}{NNN}"),
  proformaPattern: text("proforma_pattern").notNull().default("Z{YYYY}{NNN}"),
  template: text("template").notNull().default("classic"),
  accentColor: text("accent_color").notNull().default("#2563eb"),
  footerText: text("footer_text"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const bankAccount = pgTable("bank_account", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id")
    .notNull()
    .references(() => company.id, { onDelete: "cascade" }),
  label: text("label").notNull(),
  accountNumber: text("account_number"),
  bankCode: text("bank_code"),
  iban: text("iban"),
  swift: text("swift"),
  currency: text("currency").notNull().default("CZK"),
  isDefault: boolean("is_default").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const customer = pgTable("customer", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id")
    .notNull()
    .references(() => company.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  ico: text("ico"),
  dic: text("dic"),
  street: text("street"),
  city: text("city"),
  zip: text("zip"),
  country: text("country").notNull().default("CZ"),
  email: text("email"),
  phone: text("phone"),
  language: text("language").notNull().default("cs"),
  currency: text("currency").notNull().default("CZK"),
  dueDays: integer("due_days"),
  note: text("note"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const item = pgTable("item", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id")
    .notNull()
    .references(() => company.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  unit: text("unit").notNull().default("ks"),
  unitPrice: numeric("unit_price", { precision: 14, scale: 2 }).notNull(),
  vatRate: integer("vat_rate").notNull().default(21),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type Company = typeof company.$inferSelect;
export type BankAccount = typeof bankAccount.$inferSelect;
export type Customer = typeof customer.$inferSelect;
export type Item = typeof item.$inferSelect;
