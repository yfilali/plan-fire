// ── Namespaced JSON file store ──────────────────────────────────────────
//
// Single JSON file at DATA_PATH holds a root document namespaced per user:
//
//   {
//     accounts:     { [email]: { uid, name, createdAt } },
//     sessions:     { [token]: { uid, exp } },
//     magic:        { [token]: { email, uid, exp } },
//     entitlements: { [uid]:   { tier, status, renews, priceId } },
//     users:        { [uid]:   { ...the per-user KV state } }
//   }
//
// The root lives in memory as the source of truth (loaded once at startup) and
// is debounce-written to disk, preserving the original store's flush behaviour.
// The shipped market-history dataset is intentionally NOT part of this mutable
// store, so a "reset all data" never touches it.

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import path from 'path';

const DATA_PATH = process.env.DATA_PATH || '/data/state.json';

// Ensure data directory exists.
const dataDir = path.dirname(DATA_PATH);
if (!existsSync(dataDir)) mkdirSync(dataDir, { recursive: true });

function emptyRoot() {
  return { accounts: {}, sessions: {}, magic: {}, entitlements: {}, users: {} };
}

// Load root from disk once; tolerate a legacy flat (pre-namespace) document by
// folding it into a single anonymous bootstrap user is unnecessary — a fresh
// namespaced root is fine, but we still normalise missing maps defensively.
function loadRoot() {
  try {
    if (existsSync(DATA_PATH)) {
      const parsed = JSON.parse(readFileSync(DATA_PATH, 'utf8'));
      return { ...emptyRoot(), ...parsed };
    }
  } catch (err) {
    console.error('Error reading state file:', err.message);
  }
  return emptyRoot();
}

let root = loadRoot();

// ── Debounced writes ──
let writeTimer = null;
let pending = false;

function flush() {
  try {
    writeFileSync(DATA_PATH, JSON.stringify(root, null, 2), 'utf8');
  } catch (err) {
    console.error('Error writing state file:', err.message);
  }
  writeTimer = null;
  pending = false;
}

export function readRoot() {
  return root;
}

export function writeRoot(next) {
  if (next) root = next;
  pending = true;
  if (writeTimer) clearTimeout(writeTimer);
  writeTimer = setTimeout(flush, 200);
}

// Synchronous flush — used on shutdown and for delete-style operations that
// should hit disk immediately (mirrors the old forceWrite).
export function forceWrite(next) {
  if (next) root = next;
  if (writeTimer) clearTimeout(writeTimer);
  flush();
}

export function hasPendingWrite() {
  return pending;
}

// ── Per-user KV state ──

export function getUserState(uid) {
  if (!uid) return {};
  return root.users[uid] || {};
}

export function putUserState(uid, patchObj) {
  if (!uid) return 0;
  const cur = root.users[uid] || {};
  root.users[uid] = { ...cur, ...patchObj };
  writeRoot();
  return Object.keys(patchObj || {}).length;
}

export function replaceUserState(uid, obj) {
  if (!uid) return;
  root.users[uid] = { ...(obj || {}) };
  forceWrite();
}

export function setUserKey(uid, key, value) {
  if (!uid) return;
  const cur = root.users[uid] || {};
  cur[key] = value;
  root.users[uid] = cur;
  writeRoot();
}

export function deleteUserKey(uid, key) {
  if (!uid) return;
  const cur = root.users[uid];
  if (cur && key in cur) {
    delete cur[key];
    forceWrite();
  }
}

export function resetUserState(uid) {
  if (!uid) return;
  root.users[uid] = {};
  forceWrite();
}

export function userHasState(uid) {
  const s = root.users[uid];
  return !!s && Object.keys(s).length > 0;
}

// ── Entitlements ──

export function getEntitlement(uid) {
  if (!uid) return null;
  return root.entitlements[uid] || null;
}

export function setEntitlement(uid, ent) {
  if (!uid) return;
  if (ent == null) delete root.entitlements[uid];
  else root.entitlements[uid] = ent;
  forceWrite();
}

// ── Accounts ──

export function getAccountByEmail(email) {
  if (!email) return null;
  return root.accounts[email] || null;
}

export function accountByUid(uid) {
  if (!uid) return null;
  for (const [email, acct] of Object.entries(root.accounts)) {
    if (acct.uid === uid) return { email, ...acct };
  }
  return null;
}

export function createAccountIfNew(email, uid, name) {
  if (!email) return null;
  let acct = root.accounts[email];
  if (!acct) {
    acct = { uid, name: name || '', createdAt: Date.now() };
    root.accounts[email] = acct;
    writeRoot();
  }
  return acct;
}

// ── Magic-link tokens ──

export function putMagic(token, rec) {
  root.magic[token] = rec;
  writeRoot();
}

export function takeMagic(token) {
  const rec = root.magic[token];
  if (rec) {
    delete root.magic[token];
    forceWrite();
  }
  return rec || null;
}

// ── Sessions ──

export function createSession(token, uid, exp) {
  root.sessions[token] = { uid, exp };
  writeRoot();
}

export function sessionUid(token) {
  const s = token && root.sessions[token];
  if (!s) return null;
  if (s.exp && s.exp < Date.now()) {
    delete root.sessions[token];
    writeRoot();
    return null;
  }
  return s.uid;
}

export function deleteSession(token) {
  if (token && root.sessions[token]) {
    delete root.sessions[token];
    forceWrite();
  }
}
