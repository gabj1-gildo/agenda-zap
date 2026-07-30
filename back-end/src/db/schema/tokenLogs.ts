import { pgTable, uuid, integer, varchar, timestamp } from 'drizzle-orm/pg-core';
import { tenants } from './tenants';

export const tokenLogs = pgTable('token_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
  tokensUsed: integer('tokens_used').notNull(),
  interactionType: varchar('interaction_type', { length: 100 }),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
});
