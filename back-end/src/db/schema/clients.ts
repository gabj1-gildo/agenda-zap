import { pgTable, uuid, text, varchar, timestamp, unique } from 'drizzle-orm/pg-core';
import { tenants } from './tenants';

export const clients = pgTable('clients', {
  id: uuid('id').primaryKey().defaultRandom(),
  phone: varchar('phone', { length: 20 }).notNull(),
  name: text('name'),
  whatsappName: text('whatsapp_name'),
  status: varchar('status', { length: 50 }).default('Ativo'), // 'Ativo', 'Inativo', etc
  funnelStage: varchar('funnel_stage', { length: 50 }).default('espera'), // 'espera', 'atendimento_ia', 'atendimento_humano', 'aguardando_pagamento', 'finalizado', 'perdido'
  tenantId: uuid('tenant_id').references(() => tenants.id), // Can be null for older global clients during migration
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => ({
  unqPhoneTenant: unique().on(t.phone, t.tenantId),
}));
