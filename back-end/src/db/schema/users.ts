import { pgTable, uuid, text, varchar, timestamp, integer, boolean } from 'drizzle-orm/pg-core';
import { tenants } from './tenants';
import { userStatusEnum } from './enums';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name'),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  
  role: varchar('role', { length: 20 }).notNull(), // 'SUPERADMIN', 'TENANT', etc.
  
  status: userStatusEnum('status').default('ACTIVE').notNull(),
  mustResetPassword: boolean('must_reset_password').default(true).notNull(),
  
  pin: varchar('pin', { length: 255 }), // Hash Argon2 do PIN do SUPERADMIN
  
  // Brute force protection
  failedLoginAttempts: integer('failed_login_attempts').default(0).notNull(),
  lockedUntil: timestamp('locked_until'),

  phone: varchar('phone', { length: 30 }),
  cpf: varchar('cpf', { length: 14 }),
  gender: varchar('gender', { length: 20 }),
  socialName: text('social_name'),
  birthDate: varchar('birth_date', { length: 15 }),

  username: varchar('username', { length: 100 }).unique(),
  avatarUrl: text('avatar_url'),

  resetToken: varchar('reset_token', { length: 255 }),
  resetTokenExpires: timestamp('reset_token_expires'),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
