CREATE TABLE "plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"price" numeric(10, 2) NOT NULL,
	"interval" varchar(50) DEFAULT 'monthly' NOT NULL,
	"max_tenants" integer DEFAULT 1 NOT NULL,
	"max_users" integer DEFAULT 1 NOT NULL,
	"max_services" integer DEFAULT 5 NOT NULL,
	"max_appointments_per_month" integer DEFAULT 100 NOT NULL,
	"included_chats" integer DEFAULT 150 NOT NULL,
	"extra_chat_price" numeric(10, 2) DEFAULT '0.15' NOT NULL,
	"features" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"mp_plan_id" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"plan_id" uuid NOT NULL,
	"status" varchar(50) DEFAULT 'ACTIVE' NOT NULL,
	"mp_subscription_id" varchar(255),
	"trial_end" timestamp,
	"current_period_end" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"month" integer NOT NULL,
	"year" integer NOT NULL,
	"extra_chats" integer DEFAULT 0 NOT NULL,
	"total_amount" numeric(10, 2) DEFAULT '0' NOT NULL,
	"status" varchar(50) DEFAULT 'PENDING' NOT NULL,
	"payment_gateway_id" varchar(255),
	"payment_url" varchar(500),
	"due_date" timestamp,
	"paid_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_subscriptions" ADD CONSTRAINT "user_subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_subscriptions" ADD CONSTRAINT "user_subscriptions_plan_id_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."plans"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;