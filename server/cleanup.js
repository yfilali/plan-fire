// ── Stale-account cleanup (for the daily Vercel Cron job) ───────────────
//
// Deletes accounts that signed up but never verified their email within the
// grace period, plus any expired verification tokens left behind by anyone.
// session/account rows for a deleted user cascade automatically (see the FKs
// in db/schema.js) — only `user` and `verification` need direct deletes.

import { and, eq, lt } from 'drizzle-orm';
import { db } from './db/index.js';
import { user, verification } from './db/schema.js';

const DEFAULT_TTL_DAYS = 7;

function ttlCutoff() {
  const days = Number(process.env.UNVERIFIED_ACCOUNT_TTL_DAYS) || DEFAULT_TTL_DAYS;
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

export async function cleanupUnverifiedAccounts() {
  const cutoff = ttlCutoff();

  const deletedUsers = await db
    .delete(user)
    .where(and(eq(user.emailVerified, false), lt(user.createdAt, cutoff)))
    .returning({ id: user.id });

  const deletedTokens = await db
    .delete(verification)
    .where(lt(verification.expiresAt, new Date()))
    .returning({ id: verification.id });

  return {
    deletedUsers: deletedUsers.length,
    deletedTokens: deletedTokens.length,
    cutoff: cutoff.toISOString(),
  };
}
