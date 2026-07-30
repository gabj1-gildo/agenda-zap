import { pgTable, uuid, integer, varchar, boolean } from 'drizzle-orm/pg-core';
import { tenants } from './tenants';
import { professionals } from './professionals';
import { rooms } from './rooms';

export const schedules = pgTable('schedules', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
  professionalId: uuid('professional_id').references(() => professionals.id, { onDelete: 'cascade' }),
  roomId: uuid('room_id').references(() => rooms.id, { onDelete: 'cascade' }),
  dayOfWeek: integer('day_of_week').notNull(),
  startTime: varchar('start_time', { length: 5 }).notNull(),
  endTime: varchar('end_time', { length: 5 }).notNull(),
  intervalStartTime: varchar('interval_start_time', { length: 5 }),
  intervalEndTime: varchar('interval_end_time', { length: 5 }),
  slotDuration: integer('slot_duration').notNull().default(30),
  isActive: boolean('is_active').notNull().default(true),
});
