// ── Magic-link authentication + guest resolution ────────────────────────
//
// Sign-in is passwordless: POST /api/auth/start mints a 15-minute verify token
// (stored in the root `magic` map) and emails (or, in dev, console-logs) a link
// to /api/auth/verify?token=... . Verifying consumes the token, opens a session
// cookie, and — the first time — migrates any guest data into the new account.
//
// Anonymous visitors still persist their work: resolveUser mints a stable guest
// uid backed by the 'firly_guest' cookie so a browser keeps its own namespace.

import { randomBytes } from 'crypto';
import {
  createAccountIfNew,
  putMagic,
  takeMagic,
  createSession,
  sessionUid,
  deleteSession,
  getUserState,
  userHasState,
  replaceUserState,
} from './store.js';

const SESSION_COOKIE = 'firly_session';
const GUEST_COOKIE = 'firly_guest';
const MAGIC_TTL = 15 * 60 * 1000;          // 15 minutes
const SESSION_TTL = 60 * 24 * 60 * 60 * 1000; // 60 days

export { SESSION_COOKIE, GUEST_COOKIE };

export function newToken() {
  return randomBytes(24).toString('hex');
}

function uidFor(prefix) {
  return prefix + '_' + randomBytes(12).toString('hex');
}

// Whether a real email transport is configured. When not, callers surface the
// verify link directly so the demo flow is self-service.
export function hasEmailTransport() {
  return !!process.env.FIRLY_SMTP;
}

// Begin sign-in: ensure an account exists for the email, then issue a verify
// token. Returns { link, devLink? } — devLink present only in dev (no SMTP).
export function startSignIn(email) {
  const clean = String(email || '').trim().toLowerCase();
  if (!clean || !clean.includes('@')) {
    return { ok: false, error: 'A valid email is required.' };
  }
  const uid = uidFor('user');
  const acct = createAccountIfNew(clean, uid, clean.split('@')[0]);

  const token = newToken();
  putMagic(token, { email: clean, uid: acct.uid, exp: Date.now() + MAGIC_TTL });

  const link = '/api/auth/verify?token=' + token;
  if (!hasEmailTransport()) {
    // Dev transport — just log it.
    console.log(`✉️  Magic sign-in link for ${clean}: ${link}`);
    return { ok: true, link, devLink: link };
  }
  // A real transport would send `link` here.
  return { ok: true, link };
}

// Consume a verify token, opening a session. `guestUid` (from the firly_guest
// cookie) lets us migrate anonymous work into the freshly-signed-in account.
export function verify(token, guestUid) {
  const rec = takeMagic(token);
  if (!rec || (rec.exp && rec.exp < Date.now())) {
    return { ok: false, error: 'This sign-in link has expired.' };
  }
  const uid = rec.uid;

  // Migration: if the user is empty and the guest carried data, fold it in.
  if (guestUid && guestUid !== uid && userHasState(guestUid) && !userHasState(uid)) {
    replaceUserState(uid, getUserState(guestUid));
  }

  const sessionToken = newToken();
  createSession(sessionToken, uid, Date.now() + SESSION_TTL);
  return {
    ok: true,
    uid,
    cookie: { name: SESSION_COOKIE, value: sessionToken, maxAge: SESSION_TTL },
  };
}

export function signOut(sessionToken) {
  if (sessionToken) deleteSession(sessionToken);
}

// Resolve the acting uid for a request. Reads cookies parsed by the inline
// parser in index.js (req.cookies). Returns { uid, guest, setCookie? } — when a
// new guest is minted, setCookie tells the caller to write the guest cookie.
export function resolveUser(req) {
  const cookies = req.cookies || {};

  const sessionToken = cookies[SESSION_COOKIE];
  if (sessionToken) {
    const uid = sessionUid(sessionToken);
    if (uid) return { uid, guest: false };
  }

  const guestUid = cookies[GUEST_COOKIE];
  if (guestUid) return { uid: guestUid, guest: true };

  // Mint a fresh guest namespace and ask the caller to persist the cookie.
  const fresh = uidFor('guest');
  return {
    uid: fresh,
    guest: true,
    setCookie: { name: GUEST_COOKIE, value: fresh, maxAge: SESSION_TTL },
  };
}

// Express-style middleware: attaches req.uid / req.guest and, when a guest is
// first seen, sets the guest cookie on the response.
export function userMiddleware(req, res, next) {
  const resolved = resolveUser(req);
  req.uid = resolved.uid;
  req.guest = resolved.guest;
  if (resolved.setCookie) req.setCookieOut = resolved.setCookie;
  next();
}
