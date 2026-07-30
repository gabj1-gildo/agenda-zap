import { pgTable, uuid, timestamp, primaryKey } from 'drizzle-orm/pg-core';
import { clients } from './clients';
import { tags } from './tags';

export const clientTags = pgTable('client_tags', {
  clientId: uuid('client_id').references(() => clients.id, { onDelete: 'cascade' }).notNull(),
  tagId: uuid('tag_id').references(() => tags.id, { onDelete: 'cascade' }).notNull(),
  assignedAt: timestamp('assigned_at').defaultNow().notNull(),
}, (t) => ({
  pk: primaryKey({ columns: [t.clientId, t.tagId] }),
}));
