import { db } from './index';
import { sql } from 'drizzle-orm';

async function main() {
  console.log("Applying manual patch for Fase 4...");

  try {
    await db.execute(sql`ALTER TABLE "tenants" ADD COLUMN "scheduling_mode" varchar(20) DEFAULT 'GERAL' NOT NULL;`);
    console.log("Added scheduling_mode to tenants.");
  } catch (e: any) {
    console.log("Column scheduling_mode might already exist.", e.message);
  }

  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "rooms" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "tenant_id" uuid NOT NULL,
        "name" text NOT NULL,
        "capacity" integer DEFAULT 1 NOT NULL,
        "is_active" boolean DEFAULT true NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
      );
    `);
    console.log("Created rooms table.");
  } catch (e: any) {
    console.log("Error creating rooms.", e.message);
  }

  try {
    await db.execute(sql`
      ALTER TABLE "rooms" ADD CONSTRAINT "rooms_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
    `);
    console.log("Added foreign key to rooms.");
  } catch (e: any) {
    console.log("Constraint might already exist on rooms.", e.message);
  }

  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "professional_services" (
        "professional_id" uuid NOT NULL,
        "service_id" uuid NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL,
        CONSTRAINT "professional_services_professional_id_service_id_pk" PRIMARY KEY("professional_id","service_id")
      );
    `);
    console.log("Created professional_services table.");
  } catch (e: any) {
    console.log("Error creating professional_services.", e.message);
  }

  try {
    await db.execute(sql`ALTER TABLE "professional_services" ADD CONSTRAINT "professional_services_professional_id_professionals_id_fk" FOREIGN KEY ("professional_id") REFERENCES "public"."professionals"("id") ON DELETE cascade ON UPDATE no action;`);
    await db.execute(sql`ALTER TABLE "professional_services" ADD CONSTRAINT "professional_services_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;`);
    console.log("Added foreign keys to professional_services.");
  } catch (e: any) {
    console.log("Constraint might already exist on professional_services.", e.message);
  }

  try {
    await db.execute(sql`ALTER TABLE "appointments" ADD COLUMN "professional_id" uuid;`);
    await db.execute(sql`ALTER TABLE "appointments" ADD COLUMN "room_id" uuid;`);
    console.log("Added professional_id and room_id to appointments.");
  } catch (e: any) {
    console.log("Columns might already exist on appointments.", e.message);
  }

  try {
    await db.execute(sql`ALTER TABLE "appointments" ADD CONSTRAINT "appointments_professional_id_professionals_id_fk" FOREIGN KEY ("professional_id") REFERENCES "public"."professionals"("id") ON DELETE set null ON UPDATE no action;`);
    await db.execute(sql`ALTER TABLE "appointments" ADD CONSTRAINT "appointments_room_id_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE set null ON UPDATE no action;`);
    console.log("Added foreign keys to appointments.");
  } catch (e: any) {
    console.log("Constraint might already exist on appointments.", e.message);
  }

  try {
    await db.execute(sql`ALTER TABLE "schedules" ADD COLUMN "professional_id" uuid;`);
    await db.execute(sql`ALTER TABLE "schedules" ADD COLUMN "room_id" uuid;`);
    console.log("Added professional_id and room_id to schedules.");
  } catch (e: any) {
    console.log("Columns might already exist on schedules.", e.message);
  }

  try {
    await db.execute(sql`ALTER TABLE "schedules" ADD CONSTRAINT "schedules_professional_id_professionals_id_fk" FOREIGN KEY ("professional_id") REFERENCES "public"."professionals"("id") ON DELETE cascade ON UPDATE no action;`);
    await db.execute(sql`ALTER TABLE "schedules" ADD CONSTRAINT "schedules_room_id_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE cascade ON UPDATE no action;`);
    console.log("Added foreign keys to schedules.");
  } catch (e: any) {
    console.log("Constraint might already exist on schedules.", e.message);
  }

  console.log("Fase 4 Patch completed.");
  process.exit(0);
}

main().catch(console.error);
