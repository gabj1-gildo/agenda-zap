import { pgTable, uuid, varchar, boolean, timestamp, date } from 'drizzle-orm/pg-core';
import { tenants } from './tenants';

export const scheduleExceptions = pgTable('schedule_exceptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
  
  // A data específica da exceção (sem fuso horário)
  date: date('date').notNull(),
  
  // Se for true, a empresa está fechada o dia todo
  isClosed: boolean('is_closed').default(false).notNull(),
  
  // Se não estiver fechada, mas tiver horário diferente, preenche aqui
  customStartTime: varchar('custom_start_time', { length: 5 }), // Ex: "09:00"
  customEndTime: varchar('custom_end_time', { length: 5 }), // Ex: "12:00"
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
