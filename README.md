# Retirement Planner

Personal retirement planning dashboard with server-side persistence.

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
- Expense tracker with custom categories, per-expense scenario tags, age ranges, inflation overrides, and spend tiers
- Housing scenario modeling (stay, sell & move, rent out)
- Market simulation (historical avg vs "lost decade" stress test)
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
    settings/    Profile / Market / Property / Data sections
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

## Stack

- React 18 + Vite + Recharts
- Express + better-sqlite3
- Docker (multi-stage build)
- No external services, no tracking, no accounts
