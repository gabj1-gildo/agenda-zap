const fs = require('fs');
const path = require('path');

const schemaDir = path.join(__dirname, 'src', 'db', 'schema');
const filesToUpdate = ['appointments.ts', 'billing.ts', 'chatSessions.ts', 'paymentKeys.ts', 'schedules.ts', 'tokenLogs.ts', 'clients.ts'];

for (const file of filesToUpdate) {
  const filePath = path.join(schemaDir, file);
  if (!fs.existsSync(filePath)) continue;
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Replace the import
  content = content.replace(/import \{ usersAdmin \} from '\.\/usersAdmin';/g, "import { tenants } from './tenants';");
  
  // Replace foreign key reference
  content = content.replace(/references\(\(\) => usersAdmin\.id\)/g, "references(() => tenants.id)");
  
  fs.writeFileSync(filePath, content);
  console.log(`Updated ${file}`);
}

const relationsPath = path.join(schemaDir, 'relations.ts');
let relationsContent = fs.readFileSync(relationsPath, 'utf8');
relationsContent = relationsContent.replace(/import \{ usersAdmin \} from '\.\/usersAdmin';/, "import { usersAdmin } from './usersAdmin';\nimport { tenants } from './tenants';");

// Update tenant relations
relationsContent = relationsContent.replace(/export const usersAdminRelations = relations\(usersAdmin, \(\{(.*?)\}\)\);/s, `export const tenantsRelations = relations(tenants, ({ many, one }) => ({
  appointments: many(appointments),
  schedules: many(schedules),
  chatSessions: many(chatSessions),
  clients: many(clients),
  billing: one(billing),
  tokenLogs: many(tokenLogs),
  paymentKeys: many(paymentKeys),
  users: many(usersAdmin),
}));

export const usersAdminRelations = relations(usersAdmin, ({ one }) => ({
  tenant: one(tenants, {
    fields: [usersAdmin.tenantId],
    references: [tenants.id],
  }),
}));`);

relationsContent = relationsContent.replace(/tenant: one\(usersAdmin, \{[\s\S]*?references: \[usersAdmin\.id\],[\s\S]*?\}\),/g, `tenant: one(tenants, {
    fields: [$&`.replace(/$&/, '').replace(/usersAdmin\.id/g, 'tenants.id').replace(/usersAdmin/g, 'tenants'));

// A more robust replace for relations.ts:
fs.writeFileSync(relationsPath, `import { relations } from 'drizzle-orm';
import { usersAdmin } from './usersAdmin';
import { tenants } from './tenants';
import { clients } from './clients';
import { appointments } from './appointments';
import { schedules } from './schedules';
import { chatSessions } from './chatSessions';
import { billing } from './billing';
import { tokenLogs } from './tokenLogs';
import { paymentKeys } from './paymentKeys';

export const tenantsRelations = relations(tenants, ({ many, one }) => ({
  appointments: many(appointments),
  schedules: many(schedules),
  chatSessions: many(chatSessions),
  clients: many(clients),
  billing: one(billing),
  tokenLogs: many(tokenLogs),
  paymentKeys: many(paymentKeys),
  users: many(usersAdmin),
}));

export const usersAdminRelations = relations(usersAdmin, ({ one }) => ({
  tenant: one(tenants, {
    fields: [usersAdmin.tenantId],
    references: [tenants.id],
  }),
}));

export const tokenLogsRelations = relations(tokenLogs, ({ one }) => ({
  tenant: one(tenants, {
    fields: [tokenLogs.tenantId],
    references: [tenants.id],
  }),
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
  tenant: one(tenants, {
    fields: [appointments.tenantId],
    references: [tenants.id],
  }),
}));

export const chatSessionsRelations = relations(chatSessions, ({ one }) => ({
  client: one(clients, {
    fields: [chatSessions.clientId],
    references: [clients.id],
  }),
  tenant: one(tenants, {
    fields: [chatSessions.tenantId],
    references: [tenants.id],
  }),
}));

export const paymentKeysRelations = relations(paymentKeys, ({ one }) => ({
  tenant: one(tenants, {
    fields: [paymentKeys.tenantId],
    references: [tenants.id],
  }),
}));

export const schedulesRelations = relations(schedules, ({ one }) => ({
  tenant: one(tenants, {
    fields: [schedules.tenantId],
    references: [tenants.id],
  }),
}));
`);
console.log('Updated relations.ts');
