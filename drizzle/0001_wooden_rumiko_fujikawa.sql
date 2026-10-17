CREATE TABLE "bank_account" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"label" text NOT NULL,
	"account_number" text,
	"bank_code" text,
	"iban" text,
	"swift" text,
	"currency" text DEFAULT 'CZK' NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "company" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" text NOT NULL,
	"name" text NOT NULL,
	"ico" text,
	"dic" text,
	"vat_payer" boolean DEFAULT false NOT NULL,
	"street" text,
	"city" text,
	"zip" text,
	"country" text DEFAULT 'CZ' NOT NULL,
	"email" text,
	"phone" text,
	"web" text,
	"registration_note" text,
	"logo_url" text,
	"default_due_days" integer DEFAULT 14 NOT NULL,
	"default_currency" text DEFAULT 'CZK' NOT NULL,
	"invoice_pattern" text DEFAULT '{YYYY}{NNN}' NOT NULL,
	"proforma_pattern" text DEFAULT 'Z{YYYY}{NNN}' NOT NULL,
	"template" text DEFAULT 'classic' NOT NULL,
	"accent_color" text DEFAULT '#2563eb' NOT NULL,
	"footer_text" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customer" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"name" text NOT NULL,
	"ico" text,
	"dic" text,
	"street" text,
	"city" text,
	"zip" text,
	"country" text DEFAULT 'CZ' NOT NULL,
	"email" text,
	"phone" text,
	"language" text DEFAULT 'cs' NOT NULL,
	"currency" text DEFAULT 'CZK' NOT NULL,
	"due_days" integer,
	"note" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "item" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"unit" text DEFAULT 'ks' NOT NULL,
	"unit_price" numeric(14, 2) NOT NULL,
	"vat_rate" integer DEFAULT 21 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "bank_account" ADD CONSTRAINT "bank_account_company_id_company_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."company"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company" ADD CONSTRAINT "company_owner_id_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer" ADD CONSTRAINT "customer_company_id_company_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."company"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "item" ADD CONSTRAINT "item_company_id_company_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."company"("id") ON DELETE cascade ON UPDATE no action;