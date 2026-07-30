import { pgEnum } from 'drizzle-orm/pg-core';

export const appointmentStatusEnum = pgEnum('appointment_status', ['PENDENTE', 'PAGO', 'CANCELADO']);
export const billingStatusEnum = pgEnum('billing_status', ['ACTIVE', 'INACTIVE', 'OVERDUE']);
export const userStatusEnum = pgEnum('user_status', ['ACTIVE', 'INACTIVE', 'BLOCKED']);
export const auditEventEnum = pgEnum('audit_event', ['LOGIN_SUCCESS', 'LOGIN_FAILED', 'LOGOUT']);
