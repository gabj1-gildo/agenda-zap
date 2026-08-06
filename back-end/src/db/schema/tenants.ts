import { pgTable, uuid, text, varchar, timestamp, boolean, integer, jsonb } from 'drizzle-orm/pg-core';

export const tenants = pgTable('tenants', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  
  // Configurações
  phone: varchar('phone', { length: 30 }).unique(),
  email: varchar('email', { length: 255 }),
  document: varchar('document', { length: 30 }),
  description: text('description'),
  cep: varchar('cep', { length: 15 }),
  addressStreet: varchar('address_street', { length: 255 }),
  addressNumber: varchar('address_number', { length: 50 }),
  addressComplement: varchar('address_complement', { length: 255 }),
  addressNeighborhood: varchar('address_neighborhood', { length: 150 }),
  addressCity: varchar('address_city', { length: 150 }),
  addressState: varchar('address_state', { length: 2 }),
  maxUsers: integer('max_users').default(3).notNull(),
  acceptPaymentOnSite: boolean('accept_payment_on_site').default(true),
  googleCalendarToken: text('google_calendar_token'),

  // Regras de Agendamento
  minAdvanceMinutes: integer('min_advance_minutes').default(60).notNull(),
  maxAdvanceDays: integer('max_advance_days').default(30).notNull(),
  schedulingMode: varchar('scheduling_mode', { length: 20 }).default('GERAL').notNull(),
  serviceLocationType: varchar('service_location_type', { length: 20 }).default('ON_SITE').notNull(), // ON_SITE, DOMICILE, BOTH
  servicePerimeter: text('service_perimeter'), // Bairros, cidades, etc.

  // IA
  aiConfig: jsonb('ai_config'),

  // Evolution API (WhatsApp)
  evolutionInstanceName: varchar('evolution_instance_name', { length: 120 }),
  evolutionInstanceStatus: varchar('evolution_instance_status', { length: 30 }).default('DISCONNECTED'),

  // Meta Cloud API (WhatsApp)
  whatsappProvider: varchar('whatsapp_provider', { length: 50 }).default('EVOLUTION').notNull(),
  whatsappMetaToken: text('whatsapp_meta_token'),
  whatsappMetaPhoneNumberId: varchar('whatsapp_meta_phone_number_id', { length: 50 }),

  activePlan: varchar('active_plan', { length: 50 }).default('FREE').notNull(),
  paymentStatus: varchar('payment_status', { length: 50 }).default('ACTIVE').notNull(),
  
  logoUrl: text('logo_url'),
  deletedAt: timestamp('deleted_at'),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
