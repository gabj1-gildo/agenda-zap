ALTER TABLE "automations" ALTER COLUMN "client_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "automations" ADD COLUMN "name" varchar(255) DEFAULT 'Automação' NOT NULL;--> statement-breakpoint
ALTER TABLE "automations" ADD COLUMN "target_type" varchar(50) DEFAULT 'CLIENT' NOT NULL;--> statement-breakpoint
ALTER TABLE "automations" ADD COLUMN "target_value" varchar(255);--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "daily_report_enabled" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "auto_close_chats" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "auto_close_hours" integer DEFAULT 24 NOT NULL;