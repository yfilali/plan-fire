// ── Vercel serverless entrypoint ────────────────────────────────────────
//
// Vercel routes every /api/* request here (see vercel.json rewrites). An
// Express app is a valid (req, res) handler, so we export it directly. Static
// assets and the SPA shell are served by Vercel from client/dist, so this
// function only carries the API — no express.static / SPA fallback.

import { createApp } from '../server/app.js';

export default createApp();
