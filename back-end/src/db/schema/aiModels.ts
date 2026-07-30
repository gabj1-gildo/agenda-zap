import { pgTable, uuid, varchar, boolean, timestamp } from 'drizzle-orm/pg-core';

export const aiModels = pgTable('ai_models', {
  id: uuid('id').primaryKey().defaultRandom(),
  provider: varchar('provider', { length: 50 }).notNull(), // gemini, groq, deepseek
  modelId: varchar('model_id', { length: 100 }).notNull(), // gemini-2.5-flash, llama-3.1-8b-instant
  name: varchar('name', { length: 150 }).notNull(), // Gemini 2.5 Flash
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
