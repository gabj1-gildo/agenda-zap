import { pgTable, uuid, varchar, text, boolean, timestamp } from 'drizzle-orm/pg-core';
import { tenants } from './tenants';

export const paymentKeys = pgTable('payment_keys', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
  name: varchar('name', { length: 255 }).notNull(), // Nome de identificação (ex: "Mercado Pago Matriz")
  gateway: varchar('gateway', { length: 50 }).notNull(), // 'MERCADOPAGO', 'ABACATEPAY' ou 'ASAAS'
  token: text('token').notNull(),
  isActive: boolean('is_active').notNull().default(false), // O Admin seleciona qual está ativa
  pixExpirationTime: varchar('pix_expiration_time', { length: 5 }).default('00:30'), // Formato hh:mm
  cardExpirationTime: varchar('card_expiration_time', { length: 5 }).default('24:00'), // Formato hh:mm
  
  // Métodos de pagamento aceitos (para gateways que suportam mais de um, como Asaas)
  acceptsPix: boolean('accepts_pix').notNull().default(true),
  acceptsCreditCard: boolean('accepts_credit_card').notNull().default(true),
  acceptsBoleto: boolean('accepts_boleto').notNull().default(false),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
