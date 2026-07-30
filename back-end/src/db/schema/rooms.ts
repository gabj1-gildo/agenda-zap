import { pgTable, uuid, text, varchar, boolean, timestamp, integer } from 'drizzle-orm/pg-core';
import { tenants } from './tenants';

export const rooms = pgTable('rooms', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(),
  capacity: integer('capacity').default(1).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
