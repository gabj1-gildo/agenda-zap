CREATE TYPE "public"."appointment_status" AS ENUM('PENDENTE', 'PAGO', 'CANCELADO');--> statement-breakpoint
CREATE TYPE "public"."billing_status" AS ENUM('ACTIVE', 'INACTIVE', 'OVERDUE');--> statement-breakpoint
CREATE TABLE "appointments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"date" timestamp NOT NULL,
	"service_name" text NOT NULL,
	"price" numeric(10, 2) NOT NULL,
	"status" "appointment_status" DEFAULT 'PENDENTE' NOT NULL,
	"payment_id" varchar(255),
	"client_id" uuid NOT NULL,
	"tenant_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "billing" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"plan" varchar(50) NOT NULL,
	"status" "billing_status" DEFAULT 'ACTIVE' NOT NULL,
	"current_period_end" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "billing_tenant_id_unique" UNIQUE("tenant_id")
);
--> statement-breakpoint
CREATE TABLE "chat_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" uuid NOT NULL,
	"tenant_id" uuid NOT NULL,
	"status" varchar(50) DEFAULT 'ACTIVE' NOT NULL,
	"current_intent" varchar(50),
	"history" jsonb DEFAULT '[]'::jsonb,
	"context" jsonb DEFAULT '{}'::jsonb,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"phone" varchar(20) NOT NULL,
	"name" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "clients_phone_unique" UNIQUE("phone")
);
--> statement-breakpoint
CREATE TABLE "schedules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"day_of_week" integer NOT NULL,
	"start_time" varchar(5) NOT NULL,
	"end_time" varchar(5) NOT NULL,
	"interval_start_time" varchar(5),
	"interval_end_time" varchar(5),
	"slot_duration" integer DEFAULT 30 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "token_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"tokens_used" integer NOT NULL,
	"interaction_type" varchar(100),
	"timestamp" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users_admin" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" text NOT NULL,
	"phone" varchar(20),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_admin_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_tenant_id_users_admin_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."users_admin"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing" ADD CONSTRAINT "billing_tenant_id_users_admin_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."users_admin"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_sessions" ADD CONSTRAINT "chat_sessions_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_sessions" ADD CONSTRAINT "chat_sessions_tenant_id_users_admin_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."users_admin"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schedules" ADD CONSTRAINT "schedules_tenant_id_users_admin_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."users_admin"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "token_logs" ADD CONSTRAINT "token_logs_tenant_id_users_admin_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."users_admin"("id") ON DELETE no action ON UPDATE no action;