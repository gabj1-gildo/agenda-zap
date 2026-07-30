import { pgTable, uuid, varchar, timestamp } from 'drizzle-orm/pg-core';
import { tenants } from './tenants';

export const tags = pgTable('tags', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
  name: varchar('name', { length: 50 }).notNull(),
  color: varchar('color', { length: 20 }).notNull().default('#3b82f6'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
