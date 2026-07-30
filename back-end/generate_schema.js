const fs = require('fs');
const path = require('path');

const schemaDir = path.join(__dirname, 'src', 'db', 'schema');

const files = {
  'enums.ts': `import { pgEnum } from 'drizzle-orm/pg-core';

export const appointmentStatusEnum = pgEnum('appointment_status', ['PENDENTE', 'PAGO', 'CANCELADO']);
export const billingStatusEnum = pgEnum('billing_status', ['ACTIVE', 'INACTIVE', 'OVERDUE']);
`,

  'usersAdmin.ts': `import { pgTable, uuid, text, varchar, timestamp } from 'drizzle-orm/pg-core';

export const usersAdmin = pgTable('users_admin', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  phone: varchar('phone', { length: 20 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
`,

  'clients.ts': `import { pgTable, uuid, text, varchar, timestamp } from 'drizzle-orm/pg-core';

export const clients = pgTable('clients', {
  id: uuid('id').primaryKey().defaultRandom(),
  phone: varchar('phone', { length: 20 }).notNull().unique(),
  name: text('name'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
`,

  'appointments.ts': `import { pgTable, uuid, text, varchar, timestamp, decimal } from 'drizzle-orm/pg-core';
import { appointmentStatusEnum } from './enums';
import { clients } from './clients';
import { usersAdmin } from './usersAdmin';

export const appointments = pgTable('appointments', {
  id: uuid('id').primaryKey().defaultRandom(),
  date: timestamp('date').notNull(),
  serviceName: text('service_name').notNull(),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  status: appointmentStatusEnum('status').default('PENDENTE').notNull(),
  paymentId: varchar('payment_id', { length: 255 }),
  clientId: uuid('client_id').references(() => clients.id).notNull(),
  tenantId: uuid('tenant_id').references(() => usersAdmin.id).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
`,

  'schedules.ts': `import { pgTable, uuid, integer, varchar } from 'drizzle-orm/pg-core';
import { usersAdmin } from './usersAdmin';

export const schedules = pgTable('schedules', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => usersAdmin.id).notNull(),
  dayOfWeek: integer('day_of_week').notNull(),
  startTime: varchar('start_time', { length: 5 }).notNull(),
  endTime: varchar('end_time', { length: 5 }).notNull(),
  intervalStartTime: varchar('interval_start_time', { length: 5 }),
  intervalEndTime: varchar('interval_end_time', { length: 5 }),
  slotDuration: integer('slot_duration').notNull().default(30),
});
`,

  'chatSessions.ts': `import { pgTable, uuid, varchar, timestamp, jsonb } from 'drizzle-orm/pg-core';
import { clients } from './clients';
import { usersAdmin } from './usersAdmin';

export const chatSessions = pgTable('chat_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  clientId: uuid('client_id').references(() => clients.id).notNull(),
  tenantId: uuid('tenant_id').references(() => usersAdmin.id).notNull(),
  status: varchar('status', { length: 50 }).notNull().default('ACTIVE'), 
  currentIntent: varchar('current_intent', { length: 50 }),
  history: jsonb('history').default([]),
  context: jsonb('context').default({}),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
`,

  'tokenLogs.ts': `import { pgTable, uuid, integer, varchar, timestamp } from 'drizzle-orm/pg-core';
import { usersAdmin } from './usersAdmin';

export const tokenLogs = pgTable('token_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => usersAdmin.id).notNull(),
  tokensUsed: integer('tokens_used').notNull(),
  interactionType: varchar('interaction_type', { length: 100 }),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
});
`,

  'billing.ts': `import { pgTable, uuid, varchar, timestamp } from 'drizzle-orm/pg-core';
import { billingStatusEnum } from './enums';
import { usersAdmin } from './usersAdmin';

export const billing = pgTable('billing', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => usersAdmin.id).notNull().unique(),
  plan: varchar('plan', { length: 50 }).notNull(),
  status: billingStatusEnum('status').default('ACTIVE').notNull(),
  currentPeriodEnd: timestamp('current_period_end').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
`,

  'relations.ts': `import { relations } from 'drizzle-orm';
import { usersAdmin } from './usersAdmin';
import { clients } from './clients';
import { appointments } from './appointments';
import { schedules } from './schedules';
import { chatSessions } from './chatSessions';
import { billing } from './billing';

export const usersAdminRelations = relations(usersAdmin, ({ many, one }) => ({
  appointments: many(appointments),
  schedules: many(schedules),
  chatSessions: many(chatSessions),
  clients: many(clients),
  billing: one(billing),
}));

export const clientsRelations = relations(clients, ({ many }) => ({
  appointments: many(appointments),
  chatSessions: many(chatSessions),
}));

export const appointmentsRelations = relations(appointments, ({ one }) => ({
  client: one(clients, {
    fields: [appointments.clientId],
    references: [clients.id],
  }),
  tenant: one(usersAdmin, {
    fields: [appointments.tenantId],
    references: [usersAdmin.id],
  }),
}));
`,

  'index.ts': `export * from './enums';
export * from './usersAdmin';
export * from './clients';
export * from './appointments';
export * from './schedules';
export * from './chatSessions';
export * from './tokenLogs';
export * from './billing';
export * from './relations';
`
};

for (const [filename, content] of Object.entries(files)) {
  fs.writeFileSync(path.join(schemaDir, filename), content);
}

fs.writeFileSync(path.join(__dirname, 'src', 'db', 'schema.ts'), "export * from './schema';\n");

console.log("Schema refactored successfully!");
