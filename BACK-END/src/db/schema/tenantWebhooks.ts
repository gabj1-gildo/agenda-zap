import { pgTable, text, timestamp, boolean, uuid } from 'drizzle-orm/pg-core';
import { tenants } from './tenants';

export const tenantWebhooks = pgTable('tenant_webhooks', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  url: text('url').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  events: text('events').array(), // ex: ['APPOINTMENT_CREATED', 'PAYMENT_RECEIVED']
  secret: text('secret'), // for signing
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});
