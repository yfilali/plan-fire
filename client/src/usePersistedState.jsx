import { useState, useEffect, useRef, createContext, useContext, useCallback } from 'react';

const API = '/api/state';
const SAVE_DELAY = 500; // ms debounce for server writes

// ── State Store Context ─────────────────────────────────────────────

const StoreContext = createContext(null);

/**
 * Wrap your app in <StateProvider> to enable server-synced persistence.
 * On mount, loads all state from server (falls back to localStorage).
 * On any change, debounces a bulk save to the server.
 */
export function StateProvider({ children }) {
  const [store, setStore] = useState({});
  const [loaded, setLoaded] = useState(false);
  const [serverOk, setServerOk] = useState(true);
  const dirtyRef = useRef(new Set());
  const timerRef = useRef(null);
  const storeRef = useRef(store);
  storeRef.current = store;

  // Load initial state from server
  useEffect(() => {
    fetch(API)
      .then(r => r.json())
      .then(data => {
        setStore(data);
        setServerOk(true);
        // Also cache in localStorage as fallback
        Object.entries(data).forEach(([k, v]) => {
          try { localStorage.setItem(`rp_${k}`, JSON.stringify(v)); } catch {}
        });
        setLoaded(true);
      })
      .catch(() => {
        // Server down — load from localStorage
        console.warn('Server unavailable, using localStorage fallback');
        setServerOk(false);
        const local = {};
        for (let i = 0; i < localStorage.length; i++) {
          const lsKey = localStorage.key(i);
          if (lsKey?.startsWith('rp_')) {
            const key = lsKey.slice(3);
            try { local[key] = JSON.parse(localStorage.getItem(lsKey)); } catch {}
          }
        }
        setStore(local);
        setLoaded(true);
      });
  }, []);

  // Debounced save to server
  const flushToServer = useCallback(() => {
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
    setStore(prev => {
      const next = { ...prev, [key]: value };
      return next;
    });

    // Always cache in localStorage
    try { localStorage.setItem(`rp_${key}`, JSON.stringify(value)); } catch {}

    // Mark dirty and schedule server save
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
    <StoreContext.Provider value={{ store, setValue, loaded, serverOk }}>
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
  return { loaded: ctx?.loaded ?? false, serverOk: ctx?.serverOk ?? false };
}

/**
 * Export all data (triggers download from server).
 */
export async function exportData() {
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
    // Fallback: export from localStorage
    const data = {};
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k?.startsWith('rp_')) {
        try { data[k.slice(3)] = JSON.parse(localStorage.getItem(k)); } catch {}
      }
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `retirement-plan-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }
}

/**
 * Import data from JSON file.
 */
export async function importData(data) {
  try {
    await fetch('/api/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  } catch {
    // Fallback: write to localStorage
    Object.entries(data).forEach(([k, v]) => {
      try { localStorage.setItem(`rp_${k}`, JSON.stringify(v)); } catch {}
    });
  }
  window.location.reload();
}

/**
 * Clear all persisted data.
 */
export async function clearAllData() {
  try {
    await fetch(API, { method: 'DELETE' });
  } catch {}
  // Also clear localStorage
  const keys = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k?.startsWith('rp_')) keys.push(k);
  }
  keys.forEach(k => localStorage.removeItem(k));
}
