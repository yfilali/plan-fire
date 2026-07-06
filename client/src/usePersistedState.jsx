import { useState, useEffect, useRef, createContext, useContext, useCallback } from 'react';
import { useAuth } from './state/AuthProvider.jsx';
import { readLocalCache, writeLocalCache, clearLocalCache, downloadJson } from './lib/localCache.js';

const API = '/api/state';
const SAVE_DELAY = 500; // ms debounce for server writes

// ── State Store Context ─────────────────────────────────────────────

const StoreContext = createContext(null);

/**
 * Wrap your app in <StateProvider> to enable persistence. Guests are
 * local-storage only by design — their data never leaves the browser, so it
 * can never be exposed to anyone but them. Signed-in users load from/save to
 * the server (falling back to the local cache if it's unreachable).
 */
export function StateProvider({ children }) {
  const { guest, loading: authLoading } = useAuth();
  const [store, setStore] = useState({});
  const [loaded, setLoaded] = useState(false);
  const [serverOk, setServerOk] = useState(true);
  const dirtyRef = useRef(new Set());
  const timerRef = useRef(null);
  const storeRef = useRef(store);
  storeRef.current = store;
  const guestRef = useRef(guest);
  guestRef.current = guest;

  // Load initial state. Wait for auth to resolve first — we can't decide
  // whether to touch the server until we know if this is a guest.
  useEffect(() => {
    if (authLoading) return;

    if (guest) {
      setStore(readLocalCache());
      setServerOk(true);
      setLoaded(true);
      return;
    }

    fetch(API)
      .then(r => r.json())
      .then(data => {
        setStore(data);
        setServerOk(true);
        writeLocalCache(data); // also cache locally as an offline fallback
        setLoaded(true);
      })
      .catch(() => {
        console.warn('Server unavailable, using localStorage fallback');
        setServerOk(false);
        setStore(readLocalCache());
        setLoaded(true);
      });
  }, [authLoading, guest]);

  // Debounced save to server — never runs for guests.
  const flushToServer = useCallback(() => {
    if (guestRef.current) return;
    if (dirtyRef.current.size === 0) return;
    const current = storeRef.current;
    const patch = {};
    dirtyRef.current.forEach(key => { patch[key] = current[key]; });
    dirtyRef.current.clear();

    fetch(API, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    }).catch(err => {
      console.warn('Save to server failed:', err);
      setServerOk(false);
    });
  }, []);

  const setValue = useCallback((key, value) => {
    setStore(prev => ({ ...prev, [key]: value }));

    // Always cache locally — for guests this *is* the persistence, not just a cache.
    try { localStorage.setItem(`rp_${key}`, JSON.stringify(value)); } catch {}

    if (guestRef.current) return;
    dirtyRef.current.add(key);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(flushToServer, SAVE_DELAY);
  }, [flushToServer]);

  // Flush on page unload
  useEffect(() => {
    const flush = () => flushToServer();
    window.addEventListener('beforeunload', flush);
    return () => window.removeEventListener('beforeunload', flush);
  }, [flushToServer]);

  return (
    <StoreContext.Provider value={{ store, setValue, loaded, serverOk, guest }}>
      {children}
    </StoreContext.Provider>
  );
}

/**
 * Drop-in replacement for useState that persists to server + localStorage.
 */
export function usePersistedState(key, defaultValue) {
  const ctx = useContext(StoreContext);

  // Fallback if used outside provider (shouldn't happen, but safe)
  if (!ctx) {
    const [val, setVal] = useState(defaultValue);
    return [val, setVal];
  }

  const { store, setValue } = ctx;
  const value = store.hasOwnProperty(key) ? store[key] : defaultValue;

  const setter = useCallback((valOrFn) => {
    const newVal = typeof valOrFn === 'function' ? valOrFn(value) : valOrFn;
    setValue(key, newVal);
  }, [key, value, setValue]);

  return [value, setter];
}

/**
 * Hook to get connection status and loaded state.
 */
export function useStoreStatus() {
  const ctx = useContext(StoreContext);
  return {
    loaded: ctx?.loaded ?? false,
    serverOk: ctx?.serverOk ?? false,
    guest: ctx?.guest ?? true,
  };
}

/**
 * Raw access to the whole key-value store. Used for one-time data migration
 * (e.g. folding legacy top-level keys into the unified plan model).
 */
export function useStore() {
  const ctx = useContext(StoreContext);
  return {
    store: ctx?.store ?? {},
    setValue: ctx?.setValue ?? (() => {}),
    loaded: ctx?.loaded ?? false,
    serverOk: ctx?.serverOk ?? false,
  };
}

/**
 * Export all data (triggers a download). Guests are local-only, so their
 * export is always built from the browser cache; signed-in users export from
 * the server, falling back to the local cache if it's unreachable.
 */
export async function exportData(guest) {
  if (guest) {
    downloadJson(readLocalCache());
    return;
  }
  try {
    const res = await fetch('/api/export');
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `retirement-plan-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  } catch {
    downloadJson(readLocalCache());
  }
}

/**
 * Import data from JSON file. Guests write straight to localStorage; signed-in
 * users import to the server (falling back to localStorage if it's unreachable).
 */
export async function importData(data, guest) {
  if (guest) {
    writeLocalCache(data);
    window.location.reload();
    return;
  }
  try {
    await fetch('/api/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  } catch {
    writeLocalCache(data);
  }
  window.location.reload();
}

/**
 * Clear all persisted data. For guests that's just the local cache; for
 * signed-in users the server copy is wiped too.
 */
export async function clearAllData(guest) {
  if (!guest) {
    try { await fetch(API, { method: 'DELETE' }); } catch {}
  }
  clearLocalCache();
}
