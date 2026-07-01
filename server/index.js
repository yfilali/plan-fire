// ── Local / container entrypoint ────────────────────────────────────────
//
// Builds the shared Express app, then adds static client serving + the SPA
// fallback and starts an HTTP listener. On Vercel none of this runs — the
// platform serves the static client and routes /api/* to api/index.js.

import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import { createApp } from './app.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3000;

const app = createApp();

// Serve the built client and fall back to index.html for client routes.
const clientDist = path.join(__dirname, '..', 'client', 'dist');
app.use(express.static(clientDist));
app.get('*', (req, res) => {
  res.sendFile(path.join(clientDist, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🔥 Firely running on http://0.0.0.0:${PORT}`);
});
