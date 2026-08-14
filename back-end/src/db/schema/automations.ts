import { pgTable, uuid, integer, varchar, timestamp, boolean, text } from 'drizzle-orm/pg-core';
import { clients } from './clients';
import { tenants } from './tenants';

export const automations = pgTable('automations', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).default('Automação').notNull(),
  targetType: varchar('target_type', { length: 50 }).default('CLIENT').notNull(),
  targetValue: varchar('target_value', { length: 255 }),
  clientId: uuid('client_id').references(() => clients.id),
  tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
  automationType: varchar('automation_type', { length: 50 }).default('WEEKLY_CHECKIN').notNull(),
  messageTemplate: text('message_template').notNull(),
  dayOfWeek: integer('day_of_week').notNull(), // 0 = Sunday, 1 = Monday, etc.
  time: varchar('time', { length: 5 }).notNull(), // "09:00"
  nextRunAt: timestamp('next_run_at').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
