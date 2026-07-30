import { pgTable, uuid, text, decimal, integer, boolean, timestamp } from 'drizzle-orm/pg-core';
import { tenants } from './tenants';

export const services = pgTable('services', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
  name: text('name').notNull(),
  description: text('description'),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  durationMinutes: integer('duration_minutes').default(30).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
