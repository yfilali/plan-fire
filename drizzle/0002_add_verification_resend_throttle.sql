ALTER TABLE "user" ADD COLUMN "verification_email_sent_at" timestamp;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "verification_resend_count" integer DEFAULT 0 NOT NULL;