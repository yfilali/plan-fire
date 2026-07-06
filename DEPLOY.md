# Deploying PlanFIRE (Vercel + Neon + Better Auth)

The app ships as a Vite SPA (static) plus an Express API wrapped as a single
Vercel serverless function (`api/index.js`). Data lives in Neon Postgres; auth
is Better Auth (email/password + Google + Facebook).

## Architecture on Vercel

```
client/dist/**         → static assets served by Vercel
/api/*  ── rewrite ──▶  api/index.js  (Express app: Better Auth + state + AI)
                                │
                                ▼
                        Neon Postgres (DATABASE_URL)
```

`vercel.json` wires the rewrites: `/api/*` → the function, everything else →
`index.html` (SPA). The build command is `npm run build` (installs client deps
+ `vite build`); the output directory is `client/dist`.

---

## One-time setup

### 1. Connect the repo to Vercel
- Vercel → **Add New → Project** → import this Git repo.
- Framework preset: **Other** (settings come from `vercel.json`).
- Root directory: repo root. Don't override build/output — `vercel.json` owns them.
- Every push to the default branch deploys to production; every PR gets a
  preview deployment automatically.

### 2. Add Neon (the database)
- In the Vercel project: **Storage → Create Database → Neon** (or connect your
  existing Neon-via-Vercel database).
- This **injects `DATABASE_URL`** into the project's env vars automatically. Use
  the **pooled** connection (host contains `-pooler`) for serverless.
- With the integration, each Vercel **preview** gets its own Neon branch, so
  preview deploys don't touch production data.

### 3. Set the remaining environment variables
In **Project → Settings → Environment Variables** (Production + Preview):

| Var | Value |
|---|---|
| `BETTER_AUTH_SECRET` | `openssl rand -base64 32` |
| `BETTER_AUTH_URL` | your production URL, e.g. `https://firly.vercel.app` |
| `RESEND_API_KEY` | from resend.com |
| `EMAIL_FROM` | e.g. `PlanFIRE <noreply@yourdomain.com>` (verified Resend domain) |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | see step 5 |
| `FACEBOOK_CLIENT_ID` / `FACEBOOK_CLIENT_SECRET` | see step 6 |
| `ANTHROPIC_API_KEY` | optional, for the live AI co-pilot |
| `CRON_SECRET` | `openssl rand -base64 32` — see step 8 |
| `UNVERIFIED_ACCOUNT_TTL_DAYS` | optional, defaults to `7` — see step 8 |

> For preview deployments, set `BETTER_AUTH_URL` to the preview URL or add the
> preview origins to `trustedOrigins` in `server/auth.js` if you test social
> login on previews.

### 4. Run database migrations
Migrations are committed under `drizzle/`. Apply them to the Neon database:

```bash
# locally, against the prod (or a branch) DATABASE_URL
DATABASE_URL="postgres://…-pooler…/neondb?sslmode=require" npm run db:migrate
```

To change the schema later: edit `server/db/schema.js`, then
`npm run db:generate` (writes a new SQL migration) and `npm run db:migrate`.

> Migrations run automatically on deploy: `vercel.json`'s `buildCommand` is
> `npm run db:migrate && npm run build`, so each deployment migrates its own
> environment's Neon database (Drizzle skips already-applied migrations). Safe
> with the Neon+Vercel integration because each environment has its own DB/branch.
> To manage migrations manually instead, drop `db:migrate` from the build command.

### 5. Google OAuth
- console.cloud.google.com → **APIs & Services → Credentials → Create OAuth
  client ID → Web application**.
- Authorized redirect URIs:
  - `https://<your-domain>/api/auth/callback/google`
  - `http://localhost:8089/api/auth/callback/google` (local dev)
- Copy the client id/secret into the env vars.

### 6. Facebook OAuth
- developers.facebook.com → **Create App → Add Facebook Login**.
- Settings → Valid OAuth Redirect URIs:
  - `https://<your-domain>/api/auth/callback/facebook`
  - `http://localhost:8089/api/auth/callback/facebook`
- ⚠️ **Lead time:** Facebook requires **App Review / business verification**
  before it returns the user's email and before the app can leave Development
  mode. Start this early; until then only test users / app admins can log in.

### 7. Resend (email)
- Create an API key, and **verify your sending domain** so verification and
  reset emails don't land in spam. Set `EMAIL_FROM` to an address on that domain.

### 8. Daily cleanup of unverified accounts
- `vercel.json` defines a Vercel Cron Job (`crons`) that hits
  `GET /api/cron/cleanup-unverified` once a day at 03:00 UTC. It deletes
  accounts that signed up but never verified their email within
  `UNVERIFIED_ACCOUNT_TTL_DAYS` (default 7), plus any expired verification
  tokens. Cron config only takes effect after you deploy — pushing
  `vercel.json` registers it.
- **Set `CRON_SECRET`** in Project → Settings → Environment Variables. Vercel
  automatically sends `Authorization: Bearer <CRON_SECRET>` on requests it
  triggers for this project's cron jobs; the route rejects anything else (and
  refuses to run at all if the var is unset), since it's otherwise a public,
  destructive endpoint.
- Vercel Cron Jobs work on every plan, but the **Hobby plan caps jobs to once
  a day** (which is exactly what this needs) with a low limit on the number of
  cron jobs per project; Pro/Enterprise allow finer schedules and more jobs.
  See vercel.com/docs/cron-jobs for current limits.
- To test it manually: `curl -H "Authorization: Bearer $CRON_SECRET" https://<your-domain>/api/cron/cleanup-unverified`.

---

## Local development

```bash
cp .env.example .env        # fill in DATABASE_URL (a Neon dev branch), secrets
npm run db:migrate          # once, to create tables
docker compose up --build   # http://localhost:8089
```

(Without Docker and with a host Node you can run `npm install && npm start` for
the API and `npm --prefix client run dev` for the Vite dev server, which proxies
`/api` to `:3000`.)

Without `RESEND_API_KEY`, verification/reset links are printed to the server log
so you can click through locally. Without Google/Facebook credentials, those
buttons are hidden (the server reports which providers are configured via
`/api/me`).

---

## Notes
- The old single-file JSON store (`/data/state.json`) is gone. If a previous
  deployment accumulated real data there, export it and import per-user via
  `POST /api/import` after those users sign up (the schema is unchanged — it's
  the same KV blob, now in `app_state.data`).
- Guests still work: anonymous visitors are local-storage only (no server-side
  row), and that local data is uploaded and folded into their account on first
  sign-in (`/api/account/claim-guest`).
