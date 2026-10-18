CREATE TABLE "email_channel" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"preset" text DEFAULT 'custom' NOT NULL,
	"from_name" text NOT NULL,
	"from_email" text NOT NULL,
	"host" text NOT NULL,
	"port" integer DEFAULT 587 NOT NULL,
	"secure" boolean DEFAULT false NOT NULL,
	"username" text NOT NULL,
	"password_enc" text NOT NULL,
	"reply_to" text,
	"bcc" text,
	"subject_template" text,
	"body_template" text,
	"verified_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "email_channel_company_id_unique" UNIQUE("company_id")
);
--> statement-breakpoint
CREATE TABLE "email_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"invoice_id" uuid NOT NULL,
	"to" text NOT NULL,
	"subject" text NOT NULL,
	"status" text NOT NULL,
	"error" text,
	"sent_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoice" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"customer_id" uuid,
	"type" text DEFAULT 'invoice' NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"number" text,
	"variable_symbol" text,
	"issue_date" date NOT NULL,
	"tax_date" date,
	"due_date" date NOT NULL,
	"currency" text DEFAULT 'CZK' NOT NULL,
	"exchange_rate" numeric(12, 4),
	"language" text DEFAULT 'cs' NOT NULL,
	"vat_payer" boolean DEFAULT false NOT NULL,
	"bank_account_id" uuid,
	"customer_name" text NOT NULL,
	"customer_ico" text,
	"customer_dic" text,
	"customer_street" text,
	"customer_city" text,
	"customer_zip" text,
	"customer_country" text DEFAULT 'CZ' NOT NULL,
	"customer_email" text,
	"subtotal" numeric(14, 2) DEFAULT '0' NOT NULL,
	"vat_total" numeric(14, 2) DEFAULT '0' NOT NULL,
	"total" numeric(14, 2) DEFAULT '0' NOT NULL,
	"paid_amount" numeric(14, 2) DEFAULT '0' NOT NULL,
	"paid_at" date,
	"note" text,
	"public_token" text NOT NULL,
	"proforma_id" uuid,
	"recurring_id" uuid,
	"sent_at" timestamp,
	"viewed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "invoice_public_token_unique" UNIQUE("public_token")
);
--> statement-breakpoint
CREATE TABLE "invoice_line" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"invoice_id" uuid NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"name" text NOT NULL,
	"quantity" numeric(12, 3) DEFAULT '1' NOT NULL,
	"unit" text DEFAULT 'ks' NOT NULL,
	"unit_price" numeric(14, 2) DEFAULT '0' NOT NULL,
	"vat_rate" integer DEFAULT 0 NOT NULL,
	"net" numeric(14, 2) DEFAULT '0' NOT NULL,
	"vat" numeric(14, 2) DEFAULT '0' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "numbering_counter" (
	"company_id" uuid NOT NULL,
	"series" text NOT NULL,
	"year" integer NOT NULL,
	"last" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "numbering_counter_company_id_series_year_pk" PRIMARY KEY("company_id","series","year")
);
--> statement-breakpoint
CREATE TABLE "payment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"invoice_id" uuid NOT NULL,
	"date" date NOT NULL,
	"amount" numeric(14, 2) NOT NULL,
	"note" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recurring_template" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"customer_id" uuid NOT NULL,
	"name" text NOT NULL,
	"type" text DEFAULT 'invoice' NOT NULL,
	"interval" text DEFAULT 'monthly' NOT NULL,
	"next_date" date NOT NULL,
	"due_days" integer DEFAULT 14 NOT NULL,
	"currency" text DEFAULT 'CZK' NOT NULL,
	"lines" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"note" text,
	"auto_issue" boolean DEFAULT true NOT NULL,
	"auto_send" boolean DEFAULT false NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"last_run_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "email_channel" ADD CONSTRAINT "email_channel_company_id_company_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."company"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_log" ADD CONSTRAINT "email_log_invoice_id_invoice_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoice"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice" ADD CONSTRAINT "invoice_company_id_company_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."company"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice" ADD CONSTRAINT "invoice_customer_id_customer_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customer"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice" ADD CONSTRAINT "invoice_bank_account_id_bank_account_id_fk" FOREIGN KEY ("bank_account_id") REFERENCES "public"."bank_account"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_line" ADD CONSTRAINT "invoice_line_invoice_id_invoice_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoice"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "numbering_counter" ADD CONSTRAINT "numbering_counter_company_id_company_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."company"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment" ADD CONSTRAINT "payment_invoice_id_invoice_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoice"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recurring_template" ADD CONSTRAINT "recurring_template_company_id_company_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."company"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recurring_template" ADD CONSTRAINT "recurring_template_customer_id_customer_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customer"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "invoice_company_idx" ON "invoice" USING btree ("company_id","issue_date");