import { pgTable, uuid, varchar, timestamp } from 'drizzle-orm/pg-core';
import { plans } from './plans';
import { users } from './users';

export const userSubscriptions = pgTable('user_subscriptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  planId: uuid('plan_id').notNull().references(() => plans.id, { onDelete: 'restrict' }),
  
  // Status da Assinatura: 'ACTIVE', 'CANCELED', 'PAST_DUE'
  status: varchar('status', { length: 50 }).notNull().default('ACTIVE'),
  
  // ID da assinatura no Mercado Pago
  mpSubscriptionId: varchar('mp_subscription_id', { length: 255 }),

  // Data de fim do trial (período de testes de 3 dias gerido internamente)
  trialEnd: timestamp('trial_end'),
  
  // Próximo fechamento de fatura (para medir o uso)
  currentPeriodEnd: timestamp('current_period_end'),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
