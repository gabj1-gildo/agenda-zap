import { pgTable, uuid, varchar, timestamp } from 'drizzle-orm/pg-core';
import { billingStatusEnum } from './enums';
import { tenants } from './tenants';

export const billing = pgTable('billing', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id).notNull().unique(),
  plan: varchar('plan', { length: 50 }).notNull(),
  status: billingStatusEnum('status').default('ACTIVE').notNull(),
  currentPeriodEnd: timestamp('current_period_end').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
