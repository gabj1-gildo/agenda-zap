import { pgTable, uuid, varchar, timestamp } from 'drizzle-orm/pg-core';
import { tenants } from './tenants';

export const tenantPhones = pgTable('tenant_phones', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  phone: varchar('phone', { length: 30 }).notNull(),
  evolutionInstanceName: varchar('evolution_instance_name', { length: 120 }).notNull(),
  evolutionInstanceStatus: varchar('evolution_instance_status', { length: 30 }).default('DISCONNECTED'),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
