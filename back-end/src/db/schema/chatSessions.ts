import { pgTable, uuid, varchar, timestamp, jsonb, boolean } from 'drizzle-orm/pg-core';
import { clients } from './clients';
import { tenants } from './tenants';

export const chatSessions = pgTable('chat_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  clientId: uuid('client_id').references(() => clients.id).notNull(),
  tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
  status: varchar('status', { length: 50 }).notNull().default('ACTIVE'), 
  currentIntent: varchar('current_intent', { length: 50 }),
  hasUnread: boolean('has_unread').default(false).notNull(),
  history: jsonb('history').default([]),
  context: jsonb('context').default({}),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
