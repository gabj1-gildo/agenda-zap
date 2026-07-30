import { pgTable, uuid, primaryKey, timestamp } from 'drizzle-orm/pg-core';
import { professionals } from './professionals';
import { services } from './services';

export const professionalServices = pgTable('professional_services', {
  professionalId: uuid('professional_id').references(() => professionals.id, { onDelete: 'cascade' }).notNull(),
  serviceId: uuid('service_id').references(() => services.id, { onDelete: 'cascade' }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => {
  return {
    pk: primaryKey({ columns: [table.professionalId, table.serviceId] })
  };
});
