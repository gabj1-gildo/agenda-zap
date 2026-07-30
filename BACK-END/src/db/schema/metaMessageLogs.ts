import { pgTable, uuid, varchar, timestamp, text } from 'drizzle-orm/pg-core';
import { tenants } from './tenants';

export const metaMessageLogs = pgTable('meta_message_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }).notNull(),
  remoteJid: varchar('remote_jid', { length: 255 }).notNull(),
  messageType: varchar('message_type', { length: 50 }).notNull(), // 'TEXT', 'IMAGE', 'TEMPLATE'
  messageId: text('message_id'), // ID do disparo na Meta
  status: varchar('status', { length: 50 }).notNull().default('SENT'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
