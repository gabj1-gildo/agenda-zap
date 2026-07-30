ALTER TABLE "payment_keys" ADD COLUMN "accepts_pix" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "payment_keys" ADD COLUMN "accepts_credit_card" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "payment_keys" ADD COLUMN "accepts_boleto" boolean DEFAULT false NOT NULL;