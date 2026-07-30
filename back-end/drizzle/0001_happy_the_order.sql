CREATE TABLE "schedule_exceptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"date" date NOT NULL,
	"is_closed" boolean DEFAULT false NOT NULL,
	"custom_start_time" varchar(5),
	"custom_end_time" varchar(5),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "min_advance_minutes" integer DEFAULT 60 NOT NULL;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "max_advance_days" integer DEFAULT 30 NOT NULL;--> statement-breakpoint
ALTER TABLE "schedule_exceptions" ADD CONSTRAINT "schedule_exceptions_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;