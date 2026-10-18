import { boolean, date, index, integer, jsonb, numeric, pgTable, primaryKey, text, timestamp, uuid } from "drizzle-orm/pg-core";

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

export const INVOICE_TYPES = ["invoice", "proforma"] as const;
export const INVOICE_STATUSES = ["draft", "issued", "sent", "paid", "cancelled"] as const;
export type InvoiceType = (typeof INVOICE_TYPES)[number];
export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];

export const invoice = pgTable(
  "invoice",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => company.id, { onDelete: "cascade" }),
    customerId: uuid("customer_id").references(() => customer.id, { onDelete: "set null" }),
    type: text("type").$type<InvoiceType>().notNull().default("invoice"),
    status: text("status").$type<InvoiceStatus>().notNull().default("draft"),
    number: text("number"),
    variableSymbol: text("variable_symbol"),
    issueDate: date("issue_date").notNull(),
    taxDate: date("tax_date"),
    dueDate: date("due_date").notNull(),
    currency: text("currency").notNull().default("CZK"),
    exchangeRate: numeric("exchange_rate", { precision: 12, scale: 4 }),
    language: text("language").notNull().default("cs"),
    vatPayer: boolean("vat_payer").notNull().default(false),
    bankAccountId: uuid("bank_account_id").references(() => bankAccount.id, { onDelete: "set null" }),
    customerName: text("customer_name").notNull(),
    customerIco: text("customer_ico"),
    customerDic: text("customer_dic"),
    customerStreet: text("customer_street"),
    customerCity: text("customer_city"),
    customerZip: text("customer_zip"),
    customerCountry: text("customer_country").notNull().default("CZ"),
    customerEmail: text("customer_email"),
    subtotal: numeric("subtotal", { precision: 14, scale: 2 }).notNull().default("0"),
    vatTotal: numeric("vat_total", { precision: 14, scale: 2 }).notNull().default("0"),
    total: numeric("total", { precision: 14, scale: 2 }).notNull().default("0"),
    paidAmount: numeric("paid_amount", { precision: 14, scale: 2 }).notNull().default("0"),
    paidAt: date("paid_at"),
    note: text("note"),
    publicToken: text("public_token").notNull().unique(),
    proformaId: uuid("proforma_id"),
    recurringId: uuid("recurring_id"),
    sentAt: timestamp("sent_at"),
    viewedAt: timestamp("viewed_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [index("invoice_company_idx").on(t.companyId, t.issueDate)]
);

export const invoiceLine = pgTable("invoice_line", {
  id: uuid("id").primaryKey().defaultRandom(),
  invoiceId: uuid("invoice_id")
    .notNull()
    .references(() => invoice.id, { onDelete: "cascade" }),
  position: integer("position").notNull().default(0),
  name: text("name").notNull(),
  quantity: numeric("quantity", { precision: 12, scale: 3 }).notNull().default("1"),
  unit: text("unit").notNull().default("ks"),
  unitPrice: numeric("unit_price", { precision: 14, scale: 2 }).notNull().default("0"),
  vatRate: integer("vat_rate").notNull().default(0),
  net: numeric("net", { precision: 14, scale: 2 }).notNull().default("0"),
  vat: numeric("vat", { precision: 14, scale: 2 }).notNull().default("0"),
});

export const payment = pgTable("payment", {
  id: uuid("id").primaryKey().defaultRandom(),
  invoiceId: uuid("invoice_id")
    .notNull()
    .references(() => invoice.id, { onDelete: "cascade" }),
  date: date("date").notNull(),
  amount: numeric("amount", { precision: 14, scale: 2 }).notNull(),
  note: text("note"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const numberingCounter = pgTable(
  "numbering_counter",
  {
    companyId: uuid("company_id")
      .notNull()
      .references(() => company.id, { onDelete: "cascade" }),
    series: text("series").notNull(),
    year: integer("year").notNull(),
    last: integer("last").notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.companyId, t.series, t.year] })]
);

export const emailChannel = pgTable("email_channel", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id")
    .notNull()
    .unique()
    .references(() => company.id, { onDelete: "cascade" }),
  preset: text("preset").notNull().default("custom"),
  fromName: text("from_name").notNull(),
  fromEmail: text("from_email").notNull(),
  host: text("host").notNull(),
  port: integer("port").notNull().default(587),
  secure: boolean("secure").notNull().default(false),
  username: text("username").notNull(),
  passwordEnc: text("password_enc").notNull(),
  replyTo: text("reply_to"),
  bcc: text("bcc"),
  subjectTemplate: text("subject_template"),
  bodyTemplate: text("body_template"),
  verifiedAt: timestamp("verified_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const emailLog = pgTable("email_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  invoiceId: uuid("invoice_id")
    .notNull()
    .references(() => invoice.id, { onDelete: "cascade" }),
  to: text("to").notNull(),
  subject: text("subject").notNull(),
  status: text("status").notNull(),
  error: text("error"),
  sentAt: timestamp("sent_at").notNull().defaultNow(),
});

export type RecurringLine = { name: string; quantity: string; unit: string; unitPrice: string; vatRate: number };

export const recurringTemplate = pgTable("recurring_template", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id")
    .notNull()
    .references(() => company.id, { onDelete: "cascade" }),
  customerId: uuid("customer_id")
    .notNull()
    .references(() => customer.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  type: text("type").$type<InvoiceType>().notNull().default("invoice"),
  interval: text("interval").notNull().default("monthly"),
  nextDate: date("next_date").notNull(),
  dueDays: integer("due_days").notNull().default(14),
  currency: text("currency").notNull().default("CZK"),
  lines: jsonb("lines").$type<RecurringLine[]>().notNull().default([]),
  note: text("note"),
  autoIssue: boolean("auto_issue").notNull().default(true),
  autoSend: boolean("auto_send").notNull().default(false),
  active: boolean("active").notNull().default(true),
  lastRunAt: timestamp("last_run_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type Invoice = typeof invoice.$inferSelect;
export type InvoiceLine = typeof invoiceLine.$inferSelect;
export type Payment = typeof payment.$inferSelect;
export type EmailChannel = typeof emailChannel.$inferSelect;
export type EmailLog = typeof emailLog.$inferSelect;
export type RecurringTemplate = typeof recurringTemplate.$inferSelect;
