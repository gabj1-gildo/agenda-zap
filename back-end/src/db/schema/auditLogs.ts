import { pgTable, uuid, text, varchar, timestamp } from 'drizzle-orm/pg-core';
import { users } from './users';
import { auditEventEnum } from './enums';

export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id), // Nullable in case of failed login with unknown email
  email: varchar('email', { length: 255 }), // Track the email attempted
  eventType: auditEventEnum('event_type').notNull(),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
