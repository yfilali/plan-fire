// ── Postgres-backed store (Neon via Drizzle) ────────────────────────────
//
// Replaces the old single-JSON-file store. Per-owner planner state lives in
// `app_state.data` (a jsonb blob), keyed by a Better Auth user id. Guests
// never reach this table — guest mode is local-storage only. All functions
// are async.
//
// Shallow-merge semantics of the previous in-memory store are preserved with
// Postgres jsonb operators (`||` for merge, `-` for key delete).

import { sql, eq } from 'drizzle-orm';
import { db } from './db/index.js';
import { appState } from './db/schema.js';

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
