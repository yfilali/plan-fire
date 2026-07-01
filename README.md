# Firely

> **Plan your escape.** Model your runway to financial independence.

Firely is a FIRE-native retirement planning dashboard — model your runway, compare housing plans, and stress-test against down markets, with server-side persistence.

## Architecture

```
┌─────────────┐     ┌──────────────┐     ┌──────────┐
│  React SPA  │────▶│  Express API │────▶│  SQLite  │
│  (Vite)     │ /api│  (Node.js)   │     │  (/data) │
└─────────────┘     └──────────────┘     └──────────┘
       ▲                    │
       └────────────────────┘
         Serves static files
```

- **Client**: React + Recharts, built by Vite, served as static files by Express
- **Server**: Express API with SQLite (via better-sqlite3) key-value store
- **Persistence**: SQLite database on a Docker volume — survives container rebuilds
- **Fallback**: If server is unreachable, client falls back to localStorage

## Features

- **Multi-scenario planning** — create, duplicate, rename and switch between named plans; each is an independent snapshot of every input
- **Light / dark / system theming** — follows the OS by default, with a manual toggle; persisted across sessions
- **Fully responsive** — sidebar navigation collapses to a drawer on mobile; grids and charts reflow
- **User-defined housing plans** — create any number of plans (not just stay/sell/rent); each decides whether every property is kept, sold, or rented, with an optional new-home purchase and transition delay
- **Flexible properties** — model zero, one, or many properties with arbitrary values, mortgages, and rental economics
- Expense tracker with custom categories; tag each expense to whichever of *your* plans it applies to, plus age ranges, inflation overrides, and spend tiers
- Market simulation (historical avg vs "lost decade" stress test)
- **🎲 Monte Carlo success probability (Firely Pro)** — thousands of randomized return paths report the share in which your portfolio outlives you, with a terminal-wealth band (10th/50th/90th percentile). Free users see the card blurred behind an upsell.
- **🏁 FIRE milestones** — the ages your plan crosses Coast-FIRE, financial independence, $500k/$1M/$2M net worth, and (worst case) depletion — derived live from the projection.
- **✦ AI Co-pilot (Firely Pro)** — a chat assistant grounded in a minimal numeric snapshot of *your* plan. It answers with your real figures and can propose one-tap changes (e.g. "Retire at 57") applied straight to your plan. Powered by Claude; degrades to a deterministic offline reply when no API key is set.
- **⏳ Time Machine (Firely Pro)** — replay any real market era since 1928 on your actual portfolio. Allocate across stocks, Treasury bonds, corporate bonds, real estate, gold and cash, then watch real year-by-year returns drive your projection. Famous-era presets (Stagflation, the Long Bull, the Lost Decade, the GFC, …) or a custom window. Backed by a server-shipped historical dataset.
- **🔐 Accounts** — passwordless magic-link sign-in (+ guest mode that migrates your anonymous data on first login). Per-user, cookie-scoped server storage.
- **💳 Billing** — Stripe Checkout + webhook-verified entitlement (monthly / yearly / lifetime). The server is the single source of truth for Pro; the client never grants entitlement. Demo builds activate instantly when Stripe isn't configured.
- **⚙️ Settings** — tabbed: Assumptions · Account · Billing · Notifications · Privacy & Data · Appearance · Labs.
- Downturn spending-cut modeling by expense tier
- Landlord P&L calculator
- Portfolio projection through age 95 with Social Security
- Server-synced data — access from any device on your network
- Export/Import as JSON for backups

## Client Architecture

The React app is organized for maintainability — no monolithic files:

```
src/
  theme/         ThemeProvider (palettes → CSS vars) + theme.css
  state/         PlannerProvider — scenario-backed inputs + projection math
  lib/           styles, status, scenario metadata helpers
  components/
    ui.jsx       design-system primitives (Card, Button, Chip, Modal, …)
    shell/       Sidebar, TopBar, ScenarioSwitcher, ThemeToggle, Brand
    expenses/    AddExpenseForm, ExpenseRow, CategoryManager
    plans/       PlanCard, PlanEditor (per-property keep/sell/rent)
    settings/    Profile / Market / Properties / Data sections
  views/         DashboardView, ExpensesView, PlanView, SettingsView
  App.jsx        thin shell: navigation + view routing
```

State flows one way: `StateProvider` (persistence) → `ThemeProvider` + `PlannerProvider` → views via `usePlanner()` / `useTheme()`. The projection engine (`engine.js`) stays pure and unit-tested.

## Quick Start (Docker)

```bash
docker compose up -d --build
```

App runs at **http://localhost:8080**. Data persists in a Docker volume.

## Quick Start (Local Dev)

Terminal 1 — server:
```bash
cd server
npm install
DB_PATH=./dev.db node index.js
```

Terminal 2 — client (with hot reload + API proxy):
```bash
cd client
npm install
npm run dev
```

Client at **http://localhost:5173**, API calls proxied to **localhost:3000**.

## Deploy to Home Server

```bash
# Clone/copy the project
docker compose up -d --build

# Check it's running
docker logs retirement-planner

# View the database volume
docker volume inspect retirement-planner_planner-data
```

### Behind a Reverse Proxy

Container exposes port 3000 internally, mapped to 8080 on the host. Example Caddy config:

```
planner.yourdomain.com {
    reverse_proxy localhost:8080
}
```

## Data & Backups

Data lives in a Docker volume (`planner-data`). To back up:

```bash
# Via the app UI: click ⋮ → Export Data

# Or directly copy the SQLite file:
docker cp retirement-planner:/data/retirement-planner.db ./backup.db
```

To restore:
```bash
docker cp ./backup.db retirement-planner:/data/retirement-planner.db
docker restart retirement-planner
```

## API Reference

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/state` | Get all key-value pairs |
| PUT | `/api/state` | Bulk upsert keys |
| PUT | `/api/state/:key` | Upsert single key |
| DELETE | `/api/state/:key` | Delete single key |
| DELETE | `/api/state` | Reset all data |
| GET | `/api/export` | Download state as JSON |
| POST | `/api/import` | Upload JSON to replace state |
| GET | `/api/market-history` | Historical asset-class returns dataset (read-only; powers the Time Machine) |
| GET | `/api/me` | Current user, entitlement, and guest flag |
| POST | `/api/auth/start` | Begin passwordless sign-in (`{email}` → magic link) |
| GET | `/api/auth/verify?token=` | Consume a magic link, set the session cookie |
| POST | `/api/auth/signout` | End the session |
| POST | `/api/billing/checkout` | Start Stripe Checkout (or a dev-activate URL) |
| POST | `/api/billing/webhook` | Stripe webhook → sets verified entitlement |
| POST | `/api/billing/portal` | Stripe customer-portal link |
| POST | `/api/ai/chat` | Grounded co-pilot: `{messages, snapshot}` → `{reply, actions}` |

> `/api/state*`, `/api/export`, and `/api/import` are namespaced per user/guest by
> the session cookie — no client change was needed, the cookie rides along.

## Configuration

All optional — Firely runs fully in **demo mode** with none of these set (magic
links are returned/logged instead of emailed, billing activates instantly, and
the AI co-pilot uses a deterministic offline reply).

| Variable | Purpose |
|----------|---------|
| `DATA_PATH` | JSON store location (default `/data/state.json`) |
| `ANTHROPIC_API_KEY` | Enables the live AI co-pilot (Claude `claude-opus-4-8`) |
| `STRIPE_SECRET_KEY` | Enables real Stripe Checkout / portal / webhooks |
| `STRIPE_PRICE_MONTHLY` / `_YEARLY` / `_LIFETIME` | Stripe price IDs per plan |
| `STRIPE_WEBHOOK_SECRET` | Verifies incoming Stripe webhook signatures |
| `FIRLY_SMTP` | When set, magic links are emailed instead of returned in the response |

## Historical Market Dataset

The Time Machine is backed by `server/data/marketHistory.js` — annual **nominal**
total returns by asset class, **1928–2025**, served read-only at
`/api/market-history`. It ships with the server as code (not in the mutable
`/data` store), so a user "reset" never touches it and it survives every rebuild.

Asset classes: US stocks (S&P 500, dividends reinvested), 10-year Treasury
bonds, Baa corporate bonds, US residential real estate (Case-Shiller), gold,
and 3-month T-bills (cash), plus annual CPI for real-return math.

**Sources** (public, free, widely cited):

- Aswath Damodaran, NYU Stern — *Historical Returns on Stocks, Bonds, Bills,
  Real Estate and Gold* (stocks/bills/bonds/corp/real-estate/gold).
- Robert Shiller / S&P CoreLogic Case-Shiller — residential real estate.
- U.S. Bureau of Labor Statistics — CPI-U inflation.

To refresh, replace the `RAW` rows in `server/data/marketHistory.js` with the
latest published years.

## Stack

- React 18 + Vite + Recharts
- Express + JSON file KV store (per-user namespaced)
- Passwordless magic-link auth · Stripe billing · Claude AI co-pilot — all optional, demo-mode by default
- Docker (multi-stage build)
