import { db } from './index';
import { sql } from 'drizzle-orm';

async function main() {
  try {
    console.log('Running manual patch...');
    await db.execute(sql`
      CREATE TABLE "professionals" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "tenant_id" uuid NOT NULL,
        "user_id" uuid,
        "name" text NOT NULL,
        "description" text,
        "avatar_url" text,
        "is_active" boolean DEFAULT true NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
      );
    `);
    await db.execute(sql`ALTER TABLE "user_tenants" ADD COLUMN "permissions" jsonb;`);
    await db.execute(sql`ALTER TABLE "professionals" ADD CONSTRAINT "professionals_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;`);
    await db.execute(sql`ALTER TABLE "professionals" ADD CONSTRAINT "professionals_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;`);
    console.log('Patch applied successfully.');
  } catch (error: any) {
    console.error('Error applying patch:', error);
  } finally {
    process.exit(0);
  }
}

main();
