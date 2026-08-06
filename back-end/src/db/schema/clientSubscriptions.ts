import { pgTable, uuid, varchar, timestamp } from 'drizzle-orm/pg-core';
import { clients } from './clients';
import { tenantPlans } from './tenantPlans';

export const clientSubscriptions = pgTable('client_subscriptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  clientId: uuid('client_id').notNull().references(() => clients.id, { onDelete: 'cascade' }),
  tenantPlanId: uuid('tenant_plan_id').notNull().references(() => tenantPlans.id, { onDelete: 'cascade' }),
  status: varchar('status', { length: 50 }).notNull().default('ACTIVE'), // 'ACTIVE', 'EXPIRED', 'CANCELLED'
  
  startDate: timestamp('start_date').defaultNow().notNull(),
  endDate: timestamp('end_date'),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
