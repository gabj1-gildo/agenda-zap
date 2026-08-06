import { relations } from 'drizzle-orm';
import { users } from './users';
import { userTenants } from './userTenants';
import { tenants } from './tenants';
import { clients } from './clients';
import { appointments } from './appointments';
import { schedules } from './schedules';
import { chatSessions } from './chatSessions';
import { billing } from './billing';
import { tokenLogs } from './tokenLogs';
import { paymentKeys } from './paymentKeys';
import { tags } from './tags';
import { clientTags } from './clientTags';
import { services } from './services';
import { professionals } from './professionals';
import { rooms } from './rooms';
import { professionalServices } from './professionalServices';
import { metaMessageLogs } from './metaMessageLogs';

export const professionalsRelations = relations(professionals, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [professionals.tenantId],
    references: [tenants.id],
  }),
  user: one(users, {
    fields: [professionals.userId],
    references: [users.id],
  }),
  professionalServices: many(professionalServices),
  appointments: many(appointments),
  schedules: many(schedules),
}));

export const roomsRelations = relations(rooms, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [rooms.tenantId],
    references: [tenants.id],
  }),
  appointments: many(appointments),
  schedules: many(schedules),
}));

export const professionalServicesRelations = relations(professionalServices, ({ one }) => ({
  professional: one(professionals, {
    fields: [professionalServices.professionalId],
    references: [professionals.id],
  }),
  service: one(services, {
    fields: [professionalServices.serviceId],
    references: [services.id],
  }),
}));

export const metaMessageLogsRelations = relations(metaMessageLogs, ({ one }) => ({
  tenant: one(tenants, {
    fields: [metaMessageLogs.tenantId],
    references: [tenants.id],
  }),
}));

export const tenantsRelations = relations(tenants, ({ many, one }) => ({
  appointments: many(appointments),
  schedules: many(schedules),
  chatSessions: many(chatSessions),
  clients: many(clients),
  billing: one(billing),
  tokenLogs: many(tokenLogs),
  paymentKeys: many(paymentKeys),
  userTenants: many(userTenants),
  tags: many(tags),
  services: many(services),
  professionals: many(professionals),
  rooms: many(rooms),
  tenantPhones: many(tenantPhones),
  tenantPlans: many(tenantPlans),
}));

import { invoices } from './invoices';

export const usersRelations = relations(users, ({ many, one }) => ({
  userTenants: many(userTenants),
  subscription: one(userSubscriptions),
  invoices: many(invoices),
}));

export const invoicesRelations = relations(invoices, ({ one }) => ({
  user: one(users, {
    fields: [invoices.userId],
    references: [users.id],
  }),
}));

export const userTenantsRelations = relations(userTenants, ({ one }) => ({
  user: one(users, {
    fields: [userTenants.userId],
    references: [users.id],
  }),
  tenant: one(tenants, {
    fields: [userTenants.tenantId],
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
  clientTags: many(clientTags),
  clientSubscriptions: many(clientSubscriptions),
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
  service: one(services, {
    fields: [appointments.serviceId],
    references: [services.id],
  }),
  professional: one(professionals, {
    fields: [appointments.professionalId],
    references: [professionals.id],
  }),
  room: one(rooms, {
    fields: [appointments.roomId],
    references: [rooms.id],
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
  professional: one(professionals, {
    fields: [schedules.professionalId],
    references: [professionals.id],
  }),
  room: one(rooms, {
    fields: [schedules.roomId],
    references: [rooms.id],
  }),
}));

import { auditLogs } from './auditLogs';

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  user: one(users, {
    fields: [auditLogs.userId],
    references: [users.id],
  }),
}));

export const appointmentLogsRelations = relations(appointmentLogs, ({ one }) => ({
  tenant: one(tenants, {
    fields: [appointmentLogs.tenantId],
    references: [tenants.id],
  }),
  appointment: one(appointments, {
    fields: [appointmentLogs.appointmentId],
    references: [appointments.id],
  }),
  user: one(users, {
    fields: [appointmentLogs.userId],
    references: [users.id],
  }),
}));

export const tagsRelations = relations(tags, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [tags.tenantId],
    references: [tenants.id],
  }),
  clientTags: many(clientTags),
}));

export const clientTagsRelations = relations(clientTags, ({ one }) => ({
  client: one(clients, {
    fields: [clientTags.clientId],
    references: [clients.id],
  }),
  tag: one(tags, {
    fields: [clientTags.tagId],
    references: [tags.id],
  }),
}));

export const servicesRelations = relations(services, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [services.tenantId],
    references: [tenants.id],
  }),
  appointments: many(appointments),
  professionalServices: many(professionalServices),
}));


import { plans } from './plans';
import { userSubscriptions } from './userSubscriptions';
import { appointmentLogs } from './appointmentLogs';
import { tenantWebhooks } from './tenantWebhooks';

export const plansRelations = relations(plans, ({ many }) => ({
  subscriptions: many(userSubscriptions),
}));

export const userSubscriptionsRelations = relations(userSubscriptions, ({ one }) => ({
  user: one(users, {
    fields: [userSubscriptions.userId],
    references: [users.id],
  }),
  plan: one(plans, {
    fields: [userSubscriptions.planId],
    references: [plans.id],
  }),
}));

import { tenantPhones } from './tenantPhones';
import { tenantPlans } from './tenantPlans';
import { clientSubscriptions } from './clientSubscriptions';

export const tenantPhonesRelations = relations(tenantPhones, ({ one }) => ({
  tenant: one(tenants, {
    fields: [tenantPhones.tenantId],
    references: [tenants.id],
  }),
}));

export const tenantPlansRelations = relations(tenantPlans, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [tenantPlans.tenantId],
    references: [tenants.id],
  }),
  clientSubscriptions: many(clientSubscriptions),
}));

export const clientSubscriptionsRelations = relations(clientSubscriptions, ({ one }) => ({
  client: one(clients, {
    fields: [clientSubscriptions.clientId],
    references: [clients.id],
  }),
  tenantPlan: one(tenantPlans, {
    fields: [clientSubscriptions.tenantPlanId],
    references: [tenantPlans.id],
  }),
}));

