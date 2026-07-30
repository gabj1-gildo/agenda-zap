import { pgTable, uuid, varchar, text, timestamp } from 'drizzle-orm/pg-core';

export const planFeatures = pgTable('plan_features', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
