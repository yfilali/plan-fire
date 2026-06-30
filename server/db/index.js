// ── Neon Postgres connection (Drizzle) ──────────────────────────────────
//
// Uses Neon's serverless Pool (WebSocket-backed, pg-compatible) so the same
// connection works both in a long-lived local process and in Vercel's
// serverless functions. Better Auth consumes the Drizzle instance too.
//
// Node < 22 has no global WebSocket, so Neon needs one supplied. We always
// wire `ws` — harmless on newer runtimes that already provide WebSocket.

import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from 'ws';
import * as schema from './schema.js';

neonConfig.webSocketConstructor = ws;

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.warn(
    '⚠️  DATABASE_URL is not set — database calls will fail. ' +
      'Set it from your Neon (Vercel) integration.',
  );
}

export const pool = new Pool({ connectionString });
export const db = drizzle(pool, { schema });
