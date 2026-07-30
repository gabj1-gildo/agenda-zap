import { pgTable, uuid, varchar, timestamp, jsonb } from 'drizzle-orm/pg-core';
import { tenants } from './tenants';
import { appointments } from './appointments';
import { users } from './users';

export const appointmentLogs = pgTable('appointment_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }).notNull(),
  appointmentId: uuid('appointment_id').references(() => appointments.id, { onDelete: 'set null' }), // set null if appointment deleted
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }), // nullable
  actionByName: varchar('action_by_name', { length: 255 }).notNull(), // e.g. "João Silva (Atendente)" or "SISTEMA/IA"
  action: varchar('action', { length: 50 }).notNull(), // 'CREATE', 'UPDATE_STATUS', 'RESCHEDULE', 'DELETE'
  details: jsonb('details'), // { oldStatus, newStatus, oldDate, newDate, reason }
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
