ALTER TABLE "appointments" ADD COLUMN "pix_code" text;--> statement-breakpoint
ALTER TABLE "appointments" ADD COLUMN "qr_code_url" text;--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "whatsapp_name" text;--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "status" varchar(50) DEFAULT 'Ativo';--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "funnel_stage" varchar(50) DEFAULT 'Lead';--> statement-breakpoint
ALTER TABLE "users_admin" ADD COLUMN "payment_gateway" varchar(50) DEFAULT 'MERCADOPAGO';--> statement-breakpoint
ALTER TABLE "users_admin" ADD COLUMN "mp_access_token" text;--> statement-breakpoint
ALTER TABLE "users_admin" ADD COLUMN "abacatepay_token" text;--> statement-breakpoint
ALTER TABLE "users_admin" ADD COLUMN "google_access_token" text;--> statement-breakpoint
ALTER TABLE "users_admin" ADD COLUMN "google_refresh_token" text;--> statement-breakpoint
ALTER TABLE "schedules" ADD COLUMN "is_active" boolean DEFAULT true NOT NULL;