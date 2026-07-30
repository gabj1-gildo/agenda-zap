import { pgTable, uuid, varchar, timestamp, numeric, integer } from 'drizzle-orm/pg-core';
import { users } from './users';

export const invoices = pgTable('invoices', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  
  // Tipo da Fatura: 'OVERAGE' (uso extra de IA) ou 'SUBSCRIPTION' (renovação do plano)
  type: varchar('type', { length: 50 }).notNull().default('OVERAGE'),
  planId: uuid('plan_id'), // Se for do tipo SUBSCRIPTION, qual plano está renovando

  
  // Detalhes do Excedente
  month: integer('month').notNull(), // Ex: 7 para Julho
  year: integer('year').notNull(),   // Ex: 2026
  extraChats: integer('extra_chats').notNull().default(0),
  metaMessagesCount: integer('meta_messages_count').notNull().default(0),
  totalAmount: numeric('total_amount', { precision: 10, scale: 2 }).notNull().default('0'),
  
  // Status da fatura: 'PENDING', 'PAID', 'CANCELED'
  status: varchar('status', { length: 50 }).notNull().default('PENDING'),
  
  // ID do gateway de pagamento se gerado boleto/pix
  paymentGatewayId: varchar('payment_gateway_id', { length: 255 }),
  paymentUrl: varchar('payment_url', { length: 500 }),
  
  dueDate: timestamp('due_date'),
  paidAt: timestamp('paid_at'),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
