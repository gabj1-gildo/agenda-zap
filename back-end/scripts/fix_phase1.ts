import { db } from '../src/db';
import { sql } from 'drizzle-orm';

async function run() {
  console.log("Criando tabela services e alterando appointments...");
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "services" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "tenant_id" uuid NOT NULL,
        "name" text NOT NULL,
        "price" numeric(10, 2) NOT NULL,
        "duration_minutes" integer DEFAULT 30 NOT NULL,
        "is_active" boolean DEFAULT true NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL,
        CONSTRAINT "services_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action
      );
    `);
    
    // Add column if not exists
    await db.execute(sql`
      ALTER TABLE "appointments" ADD COLUMN IF NOT EXISTS "service_id" uuid;
    `);

    // Add constraint if not exists (using a DO block to ignore if exists)
    await db.execute(sql`
      DO $$
      BEGIN
          IF NOT EXISTS (
              SELECT 1 FROM pg_constraint WHERE conname = 'appointments_service_id_services_id_fk'
          ) THEN
              ALTER TABLE "appointments" ADD CONSTRAINT "appointments_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE no action ON UPDATE no action;
          END IF;
      END $$;
    `);
    
    console.log("Feito!");
  } catch (error) {
    console.error("Erro:", error);
  } finally {
    process.exit(0);
  }
}
run();
