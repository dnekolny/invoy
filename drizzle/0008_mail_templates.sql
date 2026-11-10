CREATE TABLE "mail_template" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"name" text NOT NULL,
	"subject" text NOT NULL,
	"body" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "customer" ADD COLUMN "mail_template_id" uuid;--> statement-breakpoint
ALTER TABLE "mail_template" ADD CONSTRAINT "mail_template_company_id_company_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."company"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer" ADD CONSTRAINT "customer_mail_template_id_mail_template_id_fk" FOREIGN KEY ("mail_template_id") REFERENCES "public"."mail_template"("id") ON DELETE set null ON UPDATE no action;