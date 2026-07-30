import { pgTable, uuid, timestamp, varchar } from 'drizzle-orm/pg-core';
import { users } from './users';

export const refreshTokens = pgTable('refresh_tokens', {
  id: uuid('id').primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  tokenHash: varchar('token_hash', { length: 255 }).notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  revokedAt: timestamp('revoked_at'),
  replacedBy: uuid('replaced_by'), // FK to another refresh token if rotated
  createdAt: timestamp('created_at').defaultNow().notNull(),
  ipAddress: varchar('ip_address', { length: 255 }),
  userAgent: varchar('user_agent', { length: 255 }),
});
