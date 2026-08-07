ALTER TABLE "tenant_plans" ADD COLUMN "max_installments" integer DEFAULT 1;--> statement-breakpoint
ALTER TABLE "tenant_plans" ADD COLUMN "interest_absorption" varchar(20) DEFAULT 'BUYER';