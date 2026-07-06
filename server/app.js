// ── Express app (shared by local server + Vercel function) ──────────────
//
// Builds and returns the configured Express app: Better Auth routes, the
// per-request identity resolver, namespaced state, and the AI co-pilot.
// Static file serving and the SPA fallback live in the local entrypoint
// (server/index.js); on Vercel those are served by the platform.

import express from 'express';
import { toNodeHandler } from 'better-auth/node';
import { MARKET_HISTORY } from './data/marketHistory.js';
import {
  getUserState,
  putUserState,
  setUserKey,
  deleteUserKey,
  resetUserState,
  replaceUserState,
  userHasState,
} from './store.js';
import {
  auth,
  resolveUser,
  enabledProviders,
  requestVerificationResend,
} from './auth.js';
import { chat } from './ai.js';
import { cleanupUnverifiedAccounts } from './cleanup.js';
import { eq } from 'drizzle-orm';
import { db } from './db/index.js';
import { user as userTable } from './db/schema.js';

export function createApp() {
  const app = express();

  // ── Better Auth — owns /api/auth/*. Mounted BEFORE express.json so it can
  //    read the raw request body itself. ──
  app.all('/api/auth/*', toNodeHandler(auth));

  // JSON body parsing for our own routes.
  app.use(express.json({ limit: '5mb' }));

  // ── Resolve acting user (Better Auth session, or guest) ──
  app.use(async (req, res, next) => {
    try {
      const resolved = await resolveUser(req);
      req.uid = resolved.uid;
      req.guest = resolved.guest;
      req.user = resolved.user;
      next();
    } catch (err) {
      next(err);
    }
  });

  // GET /api/cron/cleanup-unverified — Vercel Cron hits this daily (see
  // vercel.json). Vercel signs its own cron requests with `Authorization:
  // Bearer $CRON_SECRET` when that env var is set; require it here so the
  // (otherwise public, destructive) route can't be triggered by anyone else.
  app.get('/api/cron/cleanup-unverified', async (req, res) => {
    const secret = process.env.CRON_SECRET;
    if (!secret) {
      console.error('CRON_SECRET is not set — refusing to run cleanup.');
      return res.status(500).json({ ok: false, error: 'CRON_SECRET not configured' });
    }
    if (req.headers.authorization !== `Bearer ${secret}`) {
      return res.status(401).json({ ok: false, error: 'unauthorized' });
    }
    const result = await cleanupUnverifiedAccounts();
    console.log('Cleanup: unverified accounts', result);
    res.json({ ok: true, ...result });
  });

  // GET /api/market-history — read-only reference dataset.
  app.get('/api/market-history', (req, res) => {
    res.set('Cache-Control', 'public, max-age=86400');
    res.json(MARKET_HISTORY);
  });

  // ── Identity ──

  // GET /api/me — current identity + which social providers work
  app.get('/api/me', async (req, res) => {
    const u = req.user
      ? {
          email: req.user.email,
          name: req.user.name || '',
          image: req.user.image || null,
          emailVerified: !!req.user.emailVerified,
        }
      : null;
    res.json({
      user: u,
      guest: req.guest,
      providers: enabledProviders(),
    });
  });

  // POST /api/account/resend-verification — for the login screen's
  // EMAIL_NOT_VERIFIED case. Rate-limited server-side (see auth.js); the
  // response never reveals whether the email actually has an account.
  app.post('/api/account/resend-verification', async (req, res) => {
    const email = typeof req.body?.email === 'string' ? req.body.email : '';
    if (!email) return res.status(400).json({ ok: false, code: 'INVALID_EMAIL' });
    res.json(await requestVerificationResend(email));
  });

  // POST /api/account/claim-guest — fold pre-signup guest work into the
  // account on first sign-in. Guest mode is local-storage only, so the
  // client uploads its local cache as `data`; we only accept it if the
  // account doesn't already have state, so this is safe to call idempotently.
  app.post('/api/account/claim-guest', async (req, res) => {
    if (req.guest) return res.json({ ok: true, migrated: false });
    const data = req.body?.data;
    let migrated = false;
    if (data && typeof data === 'object' && Object.keys(data).length && !(await userHasState(req.uid))) {
      await replaceUserState(req.uid, data);
      migrated = true;
    }
    res.json({ ok: true, migrated });
  });

  // POST /api/account/delete — permanently remove the signed-in account (and
  // its state). Session/account rows cascade off the user row.
  app.post('/api/account/delete', async (req, res) => {
    if (req.guest) return res.status(401).json({ ok: false, error: 'not signed in' });
    await resetUserState(req.uid);
    await db.delete(userTable).where(eq(userTable.id, req.uid));
    res.json({ ok: true });
  });

  // ── Namespaced state (per resolved uid) ──
  //
  // Guests have no server-side state at all (guest mode is local-storage
  // only in the client) — these routes no-op for them rather than persisting
  // or returning anything, so there is nothing here for one guest to ever
  // read, overwrite, or collide with another's.

  app.get('/api/state', async (req, res) => {
    res.json(req.guest ? {} : await getUserState(req.uid));
  });

  app.put('/api/state', async (req, res) => {
    if (req.guest) return res.json({ ok: true, keys: 0 });
    const n = await putUserState(req.uid, req.body || {});
    res.json({ ok: true, keys: n });
  });

  app.put('/api/state/:key', async (req, res) => {
    if (req.guest) return res.json({ ok: true });
    await setUserKey(req.uid, req.params.key, req.body.value);
    res.json({ ok: true });
  });

  app.delete('/api/state/:key', async (req, res) => {
    if (req.guest) return res.json({ ok: true });
    await deleteUserKey(req.uid, req.params.key);
    res.json({ ok: true });
  });

  app.delete('/api/state', async (req, res) => {
    if (req.guest) return res.json({ ok: true });
    await resetUserState(req.uid);
    res.json({ ok: true });
  });

  app.get('/api/export', async (req, res) => {
    const dateStr = new Date().toISOString().slice(0, 10);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="retirement-plan-${dateStr}.json"`,
    );
    res.json(req.guest ? {} : await getUserState(req.uid));
  });

  app.post('/api/import', async (req, res) => {
    if (req.guest) return res.json({ ok: true, keys: 0 });
    await replaceUserState(req.uid, req.body || {});
    res.json({ ok: true, keys: Object.keys(req.body || {}).length });
  });

  // ── AI co-pilot ──

  app.post('/api/ai/chat', async (req, res) => {
    const { messages, snapshot } = req.body || {};
    const result = await chat({ messages, snapshot });
    res.json(result);
  });

  return app;
}
