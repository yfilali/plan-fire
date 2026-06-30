// ── Postgres-backed store (Neon via Drizzle) ────────────────────────────
//
// Replaces the old single-JSON-file store. Per-owner planner state lives in
// `app_state.data` (a jsonb blob), keyed by a Better Auth user id or a guest
// id. Entitlements live in their own table. All functions are async.
//
// Shallow-merge semantics of the previous in-memory store are preserved with
// Postgres jsonb operators (`||` for merge, `-` for key delete).

import { sql, eq } from 'drizzle-orm';
import { db } from './db/index.js';
import { appState, entitlements } from './db/schema.js';

// ── Per-owner KV state ──

export async function getUserState(ownerId) {
  if (!ownerId) return {};
  const rows = await db
    .select({ data: appState.data })
    .from(appState)
    .where(eq(appState.ownerId, ownerId));
  return rows[0]?.data || {};
}

// Bulk shallow-merge a patch object into the owner's state.
export async function putUserState(ownerId, patchObj) {
  if (!ownerId) return 0;
  const patch = patchObj || {};
  await db
    .insert(appState)
    .values({ ownerId, data: patch })
    .onConflictDoUpdate({
      target: appState.ownerId,
      set: {
        data: sql`${appState.data} || ${JSON.stringify(patch)}::jsonb`,
        updatedAt: sql`now()`,
      },
    });
  return Object.keys(patch).length;
}

export async function replaceUserState(ownerId, obj) {
  if (!ownerId) return;
  const next = obj || {};
  await db
    .insert(appState)
    .values({ ownerId, data: next })
    .onConflictDoUpdate({
      target: appState.ownerId,
      set: { data: next, updatedAt: sql`now()` },
    });
}

export async function setUserKey(ownerId, key, value) {
  if (!ownerId) return;
  const patch = { [key]: value };
  await db
    .insert(appState)
    .values({ ownerId, data: patch })
    .onConflictDoUpdate({
      target: appState.ownerId,
      set: {
        data: sql`${appState.data} || ${JSON.stringify(patch)}::jsonb`,
        updatedAt: sql`now()`,
      },
    });
}

export async function deleteUserKey(ownerId, key) {
  if (!ownerId) return;
  await db
    .update(appState)
    .set({ data: sql`${appState.data} - ${key}`, updatedAt: sql`now()` })
    .where(eq(appState.ownerId, ownerId));
}

export async function resetUserState(ownerId) {
  if (!ownerId) return;
  await db.delete(appState).where(eq(appState.ownerId, ownerId));
}

export async function userHasState(ownerId) {
  if (!ownerId) return false;
  const rows = await db
    .select({ data: appState.data })
    .from(appState)
    .where(eq(appState.ownerId, ownerId));
  const data = rows[0]?.data;
  return !!data && Object.keys(data).length > 0;
}

// Move a guest's state into a user's row when the user has none yet. Used on
// first sign-in so anonymous work is not lost. Returns true if a merge ran.
export async function migrateGuestState(guestId, userId) {
  if (!guestId || !userId || guestId === userId) return false;
  if (await userHasState(userId)) return false;
  if (!(await userHasState(guestId))) return false;
  const guest = await getUserState(guestId);
  await replaceUserState(userId, guest);
  await resetUserState(guestId);
  return true;
}

// ── Entitlements ──

export async function getEntitlement(ownerId) {
  if (!ownerId) return null;
  const rows = await db
    .select()
    .from(entitlements)
    .where(eq(entitlements.ownerId, ownerId));
  const row = rows[0];
  if (!row) return null;
  return {
    tier: row.tier,
    status: row.status,
    renews: row.renews ? row.renews.getTime() : null,
    priceId: row.priceId,
    stripeCustomerId: row.stripeCustomerId || undefined,
  };
}

export async function setEntitlement(ownerId, ent) {
  if (!ownerId) return;
  if (ent == null) {
    await db.delete(entitlements).where(eq(entitlements.ownerId, ownerId));
    return;
  }
  const row = {
    ownerId,
    tier: ent.tier ?? null,
    status: ent.status ?? null,
    renews: ent.renews ? new Date(ent.renews) : null,
    priceId: ent.priceId ?? null,
    stripeCustomerId: ent.stripeCustomerId ?? null,
    updatedAt: new Date(),
  };
  await db
    .insert(entitlements)
    .values(row)
    .onConflictDoUpdate({ target: entitlements.ownerId, set: row });
}

export async function setStripeCustomerId(ownerId, customerId) {
  if (!ownerId || !customerId) return;
  await db
    .insert(entitlements)
    .values({ ownerId, stripeCustomerId: customerId, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: entitlements.ownerId,
      set: { stripeCustomerId: customerId, updatedAt: new Date() },
    });
}
