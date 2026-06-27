import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { MARKET_HISTORY } from './data/marketHistory.js';
import {
  getUserState,
  putUserState,
  setUserKey,
  deleteUserKey,
  resetUserState,
  replaceUserState,
  getEntitlement,
  hasPendingWrite,
  forceWrite,
} from './store.js';
import {
  startSignIn,
  verify,
  signOut,
  resolveUser,
  hasEmailTransport,
  SESSION_COOKIE,
  GUEST_COOKIE,
} from './auth.js';
import { checkout, devActivate, webhook, portal } from './billing.js';
import { chat } from './ai.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3000;

// ── Express App ─────────────────────────────────────────────────────

const app = express();

// Capture the raw body so the Stripe webhook can verify its signature.
app.use(express.json({
  limit: '5mb',
  verify: (req, _res, buf) => { req.rawBody = buf.toString('utf8'); },
}));

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

function setCookie(res, name, value, maxAge) {
  const parts = [
    `${name}=${encodeURIComponent(value)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
  ];
  if (maxAge != null) parts.push(`Max-Age=${Math.floor(maxAge / 1000)}`);
  res.append('Set-Cookie', parts.join('; '));
}

function clearCookie(res, name) {
  res.append('Set-Cookie', `${name}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`);
}

// ── Resolve acting user (real session or persisted guest) ──
// Mints + persists a guest cookie on first contact so anonymous data survives.
app.use((req, res, next) => {
  const resolved = resolveUser(req);
  req.uid = resolved.uid;
  req.guest = resolved.guest;
  if (resolved.setCookie) {
    setCookie(res, resolved.setCookie.name, resolved.setCookie.value, resolved.setCookie.maxAge);
  }
  next();
});

// Serve static client build
const clientDist = path.join(__dirname, '..', 'client', 'dist');
app.use(express.static(clientDist));

// GET /api/market-history — premium historical dataset (read-only reference
// data shipped with the server; not part of the mutable user store, so a
// "reset all data" never touches it).
app.get('/api/market-history', (req, res) => {
  res.set('Cache-Control', 'public, max-age=86400');
  res.json(MARKET_HISTORY);
});

// ── Auth & identity ─────────────────────────────────────────────────

// GET /api/me — current identity + entitlement
app.get('/api/me', (req, res) => {
  const ent = getEntitlement(req.uid);
  const user = req.guest ? null : { email: req.uid, name: '' };
  res.json({ user, entitlement: ent, guest: req.guest });
});

// POST /api/auth/start — begin magic-link sign-in
app.post('/api/auth/start', (req, res) => {
  const { email } = req.body || {};
  const result = startSignIn(email);
  if (!result.ok) return res.status(400).json({ ok: false, error: result.error });
  // Surface the dev link only when no real email transport is configured.
  res.json({ ok: true, devLink: hasEmailTransport() ? undefined : result.devLink });
});

// GET /api/auth/verify?token=... — consume token, open session, redirect home
app.get('/api/auth/verify', (req, res) => {
  const token = req.query.token;
  const guestUid = req.cookies[GUEST_COOKIE];
  const result = verify(token, guestUid);
  if (!result.ok) {
    return res.status(400).send(result.error || 'Invalid sign-in link.');
  }
  setCookie(res, result.cookie.name, result.cookie.value, result.cookie.maxAge);
  // Drop the guest cookie now that the user is signed in.
  clearCookie(res, GUEST_COOKIE);
  res.redirect(302, '/');
});

// POST /api/auth/signout — clear session
app.post('/api/auth/signout', (req, res) => {
  signOut(req.cookies[SESSION_COOKIE]);
  clearCookie(res, SESSION_COOKIE);
  res.json({ ok: true });
});

// ── Namespaced state (per resolved uid) ─────────────────────────────

// GET /api/state — return this user's state
app.get('/api/state', (req, res) => {
  res.json(getUserState(req.uid));
});

// PUT /api/state — bulk upsert keys
app.put('/api/state', (req, res) => {
  const n = putUserState(req.uid, req.body || {});
  res.json({ ok: true, keys: n });
});

// PUT /api/state/:key — upsert single key
app.put('/api/state/:key', (req, res) => {
  setUserKey(req.uid, req.params.key, req.body.value);
  res.json({ ok: true });
});

// DELETE /api/state/:key — delete single key
app.delete('/api/state/:key', (req, res) => {
  deleteUserKey(req.uid, req.params.key);
  res.json({ ok: true });
});

// DELETE /api/state — reset this user's data
app.delete('/api/state', (req, res) => {
  resetUserState(req.uid);
  res.json({ ok: true });
});

// GET /api/export — download this user's state as JSON
app.get('/api/export', (req, res) => {
  const dateStr = new Date().toISOString().slice(0, 10);
  res.setHeader('Content-Disposition', `attachment; filename="retirement-plan-${dateStr}.json"`);
  res.json(getUserState(req.uid));
});

// POST /api/import — replace this user's state
app.post('/api/import', (req, res) => {
  replaceUserState(req.uid, req.body || {});
  res.json({ ok: true, keys: Object.keys(req.body || {}).length });
});

// ── Billing ─────────────────────────────────────────────────────────

// POST /api/billing/checkout — start checkout (real Stripe or dev url)
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

// POST /api/billing/webhook — Stripe webhook (signature-verified when configured)
app.post('/api/billing/webhook', (req, res) => {
  const result = webhook(req);
  res.status(result.status).json(result.body);
});

// POST /api/billing/dev-activate — demo "instant unlock"
app.post('/api/billing/dev-activate', (req, res) => {
  const plan = (req.body && req.body.plan) || req.query.plan || 'monthly';
  const entitlement = devActivate(req.uid, plan);
  res.json({ ok: true, entitlement });
});

// POST /api/billing/portal — billing-portal url (Stripe or '#')
app.post('/api/billing/portal', async (req, res) => {
  const result = await portal(req.uid, req);
  res.json(result);
});

// ── AI co-pilot ─────────────────────────────────────────────────────

// POST /api/ai/chat — grounded FIRE co-pilot
app.post('/api/ai/chat', async (req, res) => {
  const { messages, snapshot } = req.body || {};
  const result = await chat({ messages, snapshot });
  res.json(result);
});

// SPA fallback — keep LAST
app.get('*', (req, res) => {
  res.sendFile(path.join(clientDist, 'index.html'));
});

// ── Start ───────────────────────────────────────────────────────────

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🔥 Firly running on http://0.0.0.0:${PORT}`);
});

// Flush pending writes on shutdown
process.on('SIGTERM', () => { if (hasPendingWrite()) forceWrite(); process.exit(0); });
process.on('SIGINT', () => { if (hasPendingWrite()) forceWrite(); process.exit(0); });
