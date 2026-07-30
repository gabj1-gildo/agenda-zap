import { pgTable, uuid, timestamp, jsonb } from 'drizzle-orm/pg-core';
import { users } from './users';
import { tenants } from './tenants';

export const userTenants = pgTable('user_tenants', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  permissions: jsonb('permissions'), // Array of strings like ['agenda', 'clients', 'chats']
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
