// ── Express app (shared by local server + Vercel function) ──────────────
//
// Builds and returns the configured Express app: Better Auth routes, the
// per-request identity resolver, namespaced state, billing, and the AI
// co-pilot. Static file serving and the SPA fallback live in the local
// entrypoint (server/index.js); on Vercel those are served by the platform.

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
  getEntitlement,
  migrateGuestState,
} from './store.js';
import {
  auth,
  resolveUser,
  enabledProviders,
  GUEST_COOKIE,
} from './auth.js';
import { checkout, devActivate, webhook, portal } from './billing.js';
import { chat } from './ai.js';

function setCookie(res, name, value, maxAge) {
  const parts = [
    `${name}=${encodeURIComponent(value)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
  ];
  if (process.env.NODE_ENV === 'production') parts.push('Secure');
  if (maxAge != null) parts.push(`Max-Age=${Math.floor(maxAge / 1000)}`);
  res.append('Set-Cookie', parts.join('; '));
}

function clearCookie(res, name) {
  res.append(
    'Set-Cookie',
    `${name}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`,
  );
}

export function createApp() {
  const app = express();

  // ── Tiny cookie parser (no deps) ──
  app.use((req, _res, next) => {
    const header = req.headers.cookie;
    const out = {};
    if (header) {
      for (const part of header.split(';')) {
        const idx = part.indexOf('=');
        if (idx === -1) continue;
        const k = part.slice(0, idx).trim();
        const v = part.slice(idx + 1).trim();
        if (k) out[k] = decodeURIComponent(v);
      }
    }
    req.cookies = out;
    next();
  });

  // ── Better Auth — owns /api/auth/*. Mounted BEFORE express.json so it can
  //    read the raw request body itself. ──
  app.all('/api/auth/*', toNodeHandler(auth));

  // JSON body parsing for our own routes. Capture the raw body so the Stripe
  // webhook can verify its signature.
  app.use(
    express.json({
      limit: '5mb',
      verify: (req, _res, buf) => {
        req.rawBody = buf.toString('utf8');
      },
    }),
  );

  // ── Resolve acting user (Better Auth session or persisted guest) ──
  app.use(async (req, res, next) => {
    try {
      const resolved = await resolveUser(req);
      req.uid = resolved.uid;
      req.guest = resolved.guest;
      req.user = resolved.user;
      if (resolved.setCookie) {
        setCookie(
          res,
          resolved.setCookie.name,
          resolved.setCookie.value,
          resolved.setCookie.maxAge,
        );
      }
      next();
    } catch (err) {
      next(err);
    }
  });

  // GET /api/market-history — read-only reference dataset.
  app.get('/api/market-history', (req, res) => {
    res.set('Cache-Control', 'public, max-age=86400');
    res.json(MARKET_HISTORY);
  });

  // ── Identity ──

  // GET /api/me — current identity + entitlement + which social providers work
  app.get('/api/me', async (req, res) => {
    const ent = await getEntitlement(req.uid);
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
      entitlement: ent,
      guest: req.guest,
      providers: enabledProviders(),
    });
  });

  // POST /api/account/claim-guest — fold pre-signup guest work into the account
  // on first sign-in. No-op for guests or when the account already has data.
  app.post('/api/account/claim-guest', async (req, res) => {
    if (req.guest) return res.json({ ok: true, migrated: false });
    const guestId = req.cookies[GUEST_COOKIE];
    let migrated = false;
    if (guestId) {
      migrated = await migrateGuestState(guestId, req.uid);
      clearCookie(res, GUEST_COOKIE);
    }
    res.json({ ok: true, migrated });
  });

  // ── Namespaced state (per resolved uid) ──

  app.get('/api/state', async (req, res) => {
    res.json(await getUserState(req.uid));
  });

  app.put('/api/state', async (req, res) => {
    const n = await putUserState(req.uid, req.body || {});
    res.json({ ok: true, keys: n });
  });

  app.put('/api/state/:key', async (req, res) => {
    await setUserKey(req.uid, req.params.key, req.body.value);
    res.json({ ok: true });
  });

  app.delete('/api/state/:key', async (req, res) => {
    await deleteUserKey(req.uid, req.params.key);
    res.json({ ok: true });
  });

  app.delete('/api/state', async (req, res) => {
    await resetUserState(req.uid);
    res.json({ ok: true });
  });

  app.get('/api/export', async (req, res) => {
    const dateStr = new Date().toISOString().slice(0, 10);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="retirement-plan-${dateStr}.json"`,
    );
    res.json(await getUserState(req.uid));
  });

  app.post('/api/import', async (req, res) => {
    await replaceUserState(req.uid, req.body || {});
    res.json({ ok: true, keys: Object.keys(req.body || {}).length });
  });

  // ── Billing ──

  app.post('/api/billing/checkout', async (req, res) => {
    try {
      const { plan } = req.body || {};
      const result = await checkout(req.uid, plan, req);
      res.json(result);
    } catch (err) {
      console.error('checkout failed:', err.message);
      res.status(500).json({ error: 'Checkout failed.' });
    }
  });

  app.post('/api/billing/webhook', async (req, res) => {
    const result = await webhook(req);
    res.status(result.status).json(result.body);
  });

  app.post('/api/billing/dev-activate', async (req, res) => {
    const plan = (req.body && req.body.plan) || req.query.plan || 'monthly';
    const entitlement = await devActivate(req.uid, plan);
    res.json({ ok: true, entitlement });
  });

  app.post('/api/billing/portal', async (req, res) => {
    const result = await portal(req.uid, req);
    res.json(result);
  });

  // ── AI co-pilot ──

  app.post('/api/ai/chat', async (req, res) => {
    const { messages, snapshot } = req.body || {};
    const result = await chat({ messages, snapshot });
    res.json(result);
  });

  return app;
}
