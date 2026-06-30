// ── Drizzle schema (Postgres / Neon) ────────────────────────────────────
//
// Two groups of tables:
//   1. Better Auth core tables (user / session / account / verification).
//      Column *property names* must match Better Auth's field names exactly
//      (camelCase) — the Drizzle adapter maps by JS key, not SQL column name.
//   2. App tables — per-owner planner state and entitlements, keyed by either
//      a Better Auth user id or a guest id (both are opaque text ids).

import {
  pgTable,
  text,
  boolean,
  timestamp,
  jsonb,
} from 'drizzle-orm/pg-core';

// ── Better Auth ──────────────────────────────────────────────────────

export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').notNull().default(false),
  image: text('image'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const session = pgTable('session', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expires_at').notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
});

export const account = pgTable('account', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at'),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// ── App tables ───────────────────────────────────────────────────────

// Per-owner planner KV blob. owner_id is a Better Auth user id for signed-in
// users, or a guest id (`guest_…`) for anonymous visitors.
export const appState = pgTable('app_state', {
  ownerId: text('owner_id').primaryKey(),
  data: jsonb('data').notNull().default({}),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Pro entitlements, keyed by user id. Holds the Stripe customer id so the
// billing portal can target a real customer.
export const entitlements = pgTable('entitlements', {
  ownerId: text('owner_id').primaryKey(),
  tier: text('tier'),
  status: text('status'),
  renews: timestamp('renews'),
  priceId: text('price_id'),
  stripeCustomerId: text('stripe_customer_id'),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
