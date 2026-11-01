ALTER TABLE "company" ADD COLUMN "md_rate" numeric(14, 2);--> statement-breakpoint
ALTER TABLE "company" ADD COLUMN "hours_per_day" integer DEFAULT 8 NOT NULL;