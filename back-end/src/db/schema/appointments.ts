import { pgTable, uuid, text, varchar, timestamp, decimal } from 'drizzle-orm/pg-core';
import { appointmentStatusEnum } from './enums';
import { clients } from './clients';
import { tenants } from './tenants';
import { services } from './services';
import { professionals } from './professionals';
import { rooms } from './rooms';

export const appointments = pgTable('appointments', {
  id: uuid('id').primaryKey().defaultRandom(),
  date: timestamp('date').notNull(),
  serviceName: text('service_name').notNull(),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  status: appointmentStatusEnum('status').default('PENDENTE').notNull(),
  paymentId: varchar('payment_id', { length: 255 }), // ID da cobrança no gateway
  pixCode: text('pix_code'), // Copia e Cola
  qrCodeUrl: text('qr_code_url'), // Link da imagem do QR Code
  googleEventId: varchar('google_event_id', { length: 255 }), // ID do evento no Google Calendar
  clientId: uuid('client_id').references(() => clients.id).notNull(),
  tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
  serviceId: uuid('service_id').references(() => services.id),
  professionalId: uuid('professional_id').references(() => professionals.id, { onDelete: 'set null' }),
  roomId: uuid('room_id').references(() => rooms.id, { onDelete: 'set null' }),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
