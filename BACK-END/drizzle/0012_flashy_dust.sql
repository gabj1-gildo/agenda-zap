ALTER TABLE "invoices" ADD COLUMN "type" varchar(50) DEFAULT 'OVERAGE' NOT NULL;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "plan_id" uuid;