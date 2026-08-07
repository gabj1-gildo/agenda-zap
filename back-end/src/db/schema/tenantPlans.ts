import { pgTable, uuid, varchar, text, numeric, timestamp, integer } from 'drizzle-orm/pg-core';
import { tenants } from './tenants';

export const tenantPlans = pgTable('tenant_plans', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  type: varchar('type', { length: 50 }).notNull().default('RECURRING'), // 'RECURRING', 'SINGLE'
  durationDays: integer('duration_days'), // Null se for ilimitado ou não aplicável
  price: numeric('price', { precision: 10, scale: 2 }).notNull(),
  
  maxInstallments: integer('max_installments').default(1),
  interestAbsorption: varchar('interest_absorption', { length: 20 }).default('BUYER'), // 'BUYER' ou 'SELLER'
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
