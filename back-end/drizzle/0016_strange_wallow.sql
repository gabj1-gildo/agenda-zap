CREATE TABLE "meta_message_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"remote_jid" varchar(255) NOT NULL,
	"message_type" varchar(50) NOT NULL,
	"message_id" text,
	"status" varchar(50) DEFAULT 'SENT' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "whatsapp_provider" varchar(50) DEFAULT 'EVOLUTION' NOT NULL;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "whatsapp_meta_token" text;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "whatsapp_meta_phone_number_id" varchar(50);--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "meta_messages_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "meta_message_logs" ADD CONSTRAINT "meta_message_logs_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;