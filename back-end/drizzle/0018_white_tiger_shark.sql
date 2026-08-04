ALTER TABLE "user_subscriptions" ADD COLUMN "next_plan_id" uuid;--> statement-breakpoint
ALTER TABLE "user_subscriptions" ADD COLUMN "asaas_customer_id" varchar(255);--> statement-breakpoint
ALTER TABLE "user_subscriptions" ADD COLUMN "asaas_subscription_id" varchar(255);--> statement-breakpoint
ALTER TABLE "user_subscriptions" ADD CONSTRAINT "user_subscriptions_next_plan_id_plans_id_fk" FOREIGN KEY ("next_plan_id") REFERENCES "public"."plans"("id") ON DELETE set null ON UPDATE no action;