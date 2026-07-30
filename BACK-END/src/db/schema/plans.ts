import { pgTable, uuid, varchar, text, integer, timestamp, jsonb, numeric } from 'drizzle-orm/pg-core';

export const plans = pgTable('plans', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  price: numeric('price', { precision: 10, scale: 2 }).notNull(), // Em reais
  interval: varchar('interval', { length: 50 }).notNull().default('monthly'), // 'monthly', 'yearly'

  // Limites e Recursos do Plano
  maxTenants: integer('max_tenants').notNull().default(1), // Número de empresas que o usuário pode criar
  maxUsers: integer('max_users').notNull().default(1), // Usuários por empresa
  maxAppointmentsPerMonth: integer('max_appointments_per_month').notNull().default(100),

  // Metered Billing e Testes
  trialDays: integer('trial_days').notNull().default(0), // Dias de período de teste grátis (free trial)
  includedChats: integer('included_chats').notNull().default(150), // Atendimentos de IA Inclusos no mês (por empresa ou global)
  extraChatPrice: numeric('extra_chat_price', { precision: 10, scale: 2 }).notNull().default('0.15'), // Preço por chat extra

  features: jsonb('features').notNull().default([]), // array de strings com as features listadas

  // Mercado Pago
  mpPlanId: varchar('mp_plan_id', { length: 255 }), // ID do plano no Mercado Pago (Preapproval Plan ID)

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
