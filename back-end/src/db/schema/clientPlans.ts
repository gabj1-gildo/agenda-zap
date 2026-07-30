import { pgTable, uuid, integer, varchar, timestamp } from 'drizzle-orm/pg-core';
import { clients } from './clients';
import { tenants } from './tenants';

export const clientPlans = pgTable('client_plans', {
  id: uuid('id').primaryKey().defaultRandom(),
  clientId: uuid('client_id').references(() => clients.id).notNull().unique(),
  tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
  durationMonths: integer('duration_months').notNull(),
  startDate: timestamp('start_date').defaultNow().notNull(),
  endDate: timestamp('end_date').notNull(),
  status: varchar('status', { length: 50 }).default('ACTIVE').notNull(), // ACTIVE, EXPIRED, CANCELED
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
