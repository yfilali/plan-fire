// ── Local `rp_*` cache (localStorage) ───────────────────────────────
//
// Shared by usePersistedState.jsx (the persistence layer) and AuthProvider
// (sign-out cleanup, guest-claim upload), kept in its own module so neither
// has to import the other.

export function readLocalCache() {
  const data = {};
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k?.startsWith('rp_')) {
      try { data[k.slice(3)] = JSON.parse(localStorage.getItem(k)); } catch {}
    }
  }
  return data;
}

export function writeLocalCache(data) {
  Object.entries(data).forEach(([k, v]) => {
    try { localStorage.setItem(`rp_${k}`, JSON.stringify(v)); } catch {}
  });
}

export function clearLocalCache() {
  const keys = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k?.startsWith('rp_')) keys.push(k);
  }
  keys.forEach(k => localStorage.removeItem(k));
}

export function downloadJson(data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `retirement-plan-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
