ALTER TABLE "email_channel" ADD COLUMN "reminders_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "email_channel" ADD COLUMN "reminder_days" text DEFAULT '3,10,20' NOT NULL;--> statement-breakpoint
ALTER TABLE "email_channel" ADD COLUMN "reminder_subject_template" text;--> statement-breakpoint
ALTER TABLE "email_channel" ADD COLUMN "reminder_body_template" text;--> statement-breakpoint
ALTER TABLE "email_log" ADD COLUMN "kind" text DEFAULT 'invoice' NOT NULL;--> statement-breakpoint
ALTER TABLE "invoice" ADD COLUMN "intro" text;--> statement-breakpoint
ALTER TABLE "invoice" ADD COLUMN "reminder_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "invoice" ADD COLUMN "last_reminder_at" timestamp;--> statement-breakpoint
ALTER TABLE "recurring_template" ADD COLUMN "intro" text;