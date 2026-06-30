// ── Billing (Stripe-optional) ───────────────────────────────────────────
//
// When STRIPE_SECRET_KEY is set we drive real Stripe Checkout / Billing Portal
// via the REST API (global fetch, no SDK dependency). Otherwise every entry
// point degrades to a self-service dev flow: checkout returns a local
// /api/billing/dev-activate URL that instantly unlocks the demo entitlement.

import { createHmac, timingSafeEqual } from 'crypto';
import { setEntitlement, getEntitlement, setStripeCustomerId } from './store.js';

// Mirror client/src/lib/pro.js PRO pricing.
const PRICES = { monthly: 6, yearly: 49, lifetime: 149 };

const PRICE_ENV = {
  monthly: 'STRIPE_PRICE_MONTHLY',
  yearly: 'STRIPE_PRICE_YEARLY',
  lifetime: 'STRIPE_PRICE_LIFETIME',
};

function stripeKey() {
  return process.env.STRIPE_SECRET_KEY || '';
}

function planPriceId(plan) {
  return process.env[PRICE_ENV[plan]] || '';
}

function baseUrl(req) {
  const proto = req.headers['x-forwarded-proto'] || 'http';
  const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost:3000';
  return `${proto}://${host}`;
}

// POST form-encode helper for Stripe's REST API.
function form(obj) {
  const p = new URLSearchParams();
  const walk = (prefix, val) => {
    if (val == null) return;
    if (Array.isArray(val)) {
      val.forEach((v, i) => walk(`${prefix}[${i}]`, v));
    } else if (typeof val === 'object') {
      for (const [k, v] of Object.entries(val)) walk(`${prefix}[${k}]`, v);
    } else {
      p.append(prefix, String(val));
    }
  };
  for (const [k, v] of Object.entries(obj)) walk(k, v);
  return p.toString();
}

async function stripe(pathname, body) {
  const res = await fetch('https://api.stripe.com/v1' + pathname, {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + stripeKey(),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: form(body),
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json?.error?.message || 'Stripe request failed');
  }
  return json;
}

// Create a checkout session (or a dev-activate URL when Stripe isn't wired).
export async function checkout(uid, plan, req) {
  const p = PRICES[plan] ? plan : 'monthly';

  if (!stripeKey() || !planPriceId(p)) {
    return { url: '/api/billing/dev-activate?plan=' + p };
  }

  const origin = baseUrl(req);
  const mode = p === 'lifetime' ? 'payment' : 'subscription';
  const session = await stripe('/checkout/sessions', {
    mode,
    client_reference_id: uid,
    line_items: [{ price: planPriceId(p), quantity: 1 }],
    success_url: origin + '/?billing=success',
    cancel_url: origin + '/?billing=cancel',
    metadata: { uid, plan: p },
  });
  return { url: session.url };
}

// Set the demo entitlement directly (dev unlock + Stripe webhook completion).
export async function devActivate(uid, plan) {
  const p = PRICES[plan] ? plan : 'monthly';
  const now = Date.now();
  const renews =
    p === 'lifetime'
      ? null
      : p === 'yearly'
        ? now + 365 * 24 * 60 * 60 * 1000
        : now + 30 * 24 * 60 * 60 * 1000;
  const ent = {
    tier: 'pro',
    status: 'active',
    renews,
    priceId: planPriceId(p) || ('dev_' + p),
  };
  await setEntitlement(uid, ent);
  return ent;
}

// Verify a Stripe webhook signature (constant-time) against the raw body.
function verifySignature(rawBody, sigHeader, secret) {
  if (!sigHeader) return false;
  const parts = Object.fromEntries(
    sigHeader.split(',').map((kv) => kv.split('=')),
  );
  const t = parts.t;
  const v1 = parts.v1;
  if (!t || !v1) return false;
  const expected = createHmac('sha256', secret)
    .update(`${t}.${rawBody}`)
    .digest('hex');
  try {
    return timingSafeEqual(Buffer.from(expected), Buffer.from(v1));
  } catch {
    return false;
  }
}

// Handle an incoming webhook. `req.rawBody` must be the raw request payload.
export async function webhook(req) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET || '';
  let event;

  if (secret) {
    const ok = verifySignature(
      req.rawBody || '',
      req.headers['stripe-signature'],
      secret,
    );
    if (!ok) return { status: 400, body: { error: 'Invalid signature' } };
    try {
      event = JSON.parse(req.rawBody);
    } catch {
      return { status: 400, body: { error: 'Bad payload' } };
    }
  } else {
    // No secret configured — accept the parsed body as-is (dev/testing).
    event = req.body || {};
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data?.object || {};
    const uid = session.client_reference_id || session.metadata?.uid;
    const plan = session.metadata?.plan || 'monthly';
    if (uid) {
      // Remember the Stripe customer so the billing portal can target it.
      if (session.customer) await setStripeCustomerId(uid, session.customer);
      await devActivate(uid, plan);
    }
  }
  return { status: 200, body: { received: true } };
}

// Billing-portal URL (Stripe portal when configured, else a no-op anchor).
// Targets the Stripe customer recorded at checkout — not the app uid.
export async function portal(uid, req) {
  if (!stripeKey()) return { url: '#' };
  const ent = await getEntitlement(uid);
  const customer = ent?.stripeCustomerId;
  if (!customer) return { url: '#' };
  try {
    const origin = baseUrl(req);
    const session = await stripe('/billing_portal/sessions', {
      customer,
      return_url: origin + '/?view=settings',
    });
    return { url: session.url };
  } catch {
    return { url: '#' };
  }
}
