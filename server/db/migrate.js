// ── Migration runner ────────────────────────────────────────────────────
//
// Applies the SQL migrations in ./drizzle against DATABASE_URL, then exits.
// Run locally or in CI with `npm run db:migrate`. Safe to run repeatedly —
// Drizzle tracks which migrations have been applied.

import { migrate } from 'drizzle-orm/neon-serverless/migrator';
import { db, pool } from './index.js';

const run = async () => {
  console.log('Running migrations…');
  await migrate(db, { migrationsFolder: './drizzle' });
  console.log('✅ Migrations applied.');
  await pool.end();
};

run().catch((err) => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
