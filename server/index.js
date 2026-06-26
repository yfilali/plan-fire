import express from 'express';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { MARKET_HISTORY } from './data/marketHistory.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3000;
const DATA_PATH = process.env.DATA_PATH || '/data/state.json';

// Ensure data directory exists
const dataDir = path.dirname(DATA_PATH);
if (!existsSync(dataDir)) mkdirSync(dataDir, { recursive: true });

// ── JSON File Store ─────────────────────────────────────────────────

function readState() {
  try {
    if (existsSync(DATA_PATH)) {
      return JSON.parse(readFileSync(DATA_PATH, 'utf8'));
    }
  } catch (err) {
    console.error('Error reading state file:', err.message);
  }
  return {};
}

// Debounced write to avoid thrashing disk on rapid updates
let writeTimer = null;
let pendingState = null;

function scheduleWrite(state) {
  pendingState = state;
  if (writeTimer) clearTimeout(writeTimer);
  writeTimer = setTimeout(() => {
    try {
      writeFileSync(DATA_PATH, JSON.stringify(pendingState, null, 2), 'utf8');
    } catch (err) {
      console.error('Error writing state file:', err.message);
    }
    writeTimer = null;
    pendingState = null;
  }, 200);
}

function forceWrite(state) {
  if (writeTimer) clearTimeout(writeTimer);
  try {
    writeFileSync(DATA_PATH, JSON.stringify(state, null, 2), 'utf8');
  } catch (err) {
    console.error('Error writing state file:', err.message);
  }
}

// ── Express App ─────────────────────────────────────────────────────

const app = express();
app.use(express.json({ limit: '5mb' }));

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

// GET /api/state — return all state
app.get('/api/state', (req, res) => {
  res.json(readState());
});

// PUT /api/state — bulk upsert keys
app.put('/api/state', (req, res) => {
  const current = readState();
  const updated = { ...current, ...req.body };
  scheduleWrite(updated);
  res.json({ ok: true, keys: Object.keys(req.body).length });
});

// PUT /api/state/:key — upsert single key
app.put('/api/state/:key', (req, res) => {
  const current = readState();
  current[req.params.key] = req.body.value;
  scheduleWrite(current);
  res.json({ ok: true });
});

// DELETE /api/state/:key — delete single key
app.delete('/api/state/:key', (req, res) => {
  const current = readState();
  delete current[req.params.key];
  forceWrite(current);
  res.json({ ok: true });
});

// DELETE /api/state — reset all data
app.delete('/api/state', (req, res) => {
  forceWrite({});
  res.json({ ok: true });
});

// GET /api/export — download state as JSON
app.get('/api/export', (req, res) => {
  const state = readState();
  const dateStr = new Date().toISOString().slice(0, 10);
  res.setHeader('Content-Disposition', `attachment; filename="retirement-plan-${dateStr}.json"`);
  res.json(state);
});

// POST /api/import — replace all state
app.post('/api/import', (req, res) => {
  forceWrite(req.body);
  res.json({ ok: true, keys: Object.keys(req.body).length });
});

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(clientDist, 'index.html'));
});

// ── Start ───────────────────────────────────────────────────────────

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🔥 Firly running on http://0.0.0.0:${PORT}`);
  console.log(`📦 Data file: ${DATA_PATH}`);
});

// Flush pending writes on shutdown
process.on('SIGTERM', () => { if (pendingState) forceWrite(pendingState); process.exit(0); });
process.on('SIGINT', () => { if (pendingState) forceWrite(pendingState); process.exit(0); });
