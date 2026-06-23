# Merge "Scenario" and "Housing Plan" into one `Plan` — Fan-out Spec

> Hand each **TASK** below to a Sonnet agent. Every agent also receives the
> **MASTER CONTEXT** (it is the shared system prompt). Run **Phase 1 first and
> let it land**; then Phases 2A–2D can run in parallel (disjoint files); then run
> Phase 3.

---

## MASTER CONTEXT (prepend to every agent)

You are working in a React + Vite retirement-planning SPA at
`/home/yacine/Projects/retirement-planner/client`. State is persisted via a
key-value store (`usePersistedState`) backed by an Express JSON server; the
server is generic and needs **no** changes.

### The problem we are fixing
The app currently has **two overlapping "plan" concepts**:

1. **Scenario** (top-level, `ScenarioSwitcher` in the top bar): a named container
   holding a full snapshot of inputs — profile, market, downturn cuts,
   categories, expenses, properties, **and** a list of housing plans. The UI
   confusingly also calls these "plans" ("My Plan", "New plan").
2. **Housing plan** (inner, the `plans` array shown in `PlanView`):
   `{ actions:{propId→keep|sell|rent}, newHomeCost, transitionYears, baseline, icon, tone }`.
   One is "active" and drives the dashboard.

Worse, **`expense.scenarios` is misnamed** — it actually stores *housing-plan IDs*
(or `"all"`). The engine's `scenario` parameter is really a housing-plan id.

### Target model — ONE `Plan` concept
Collapse both layers into a single, flat, top-level **`Plan`**. A Plan is a
**named filter + configuration**: every expense and every property (asset) can be
toggled on/off per plan, and each plan carries its own inputs + housing config.

**New persisted root keys** (siblings in the KV store, no `scenarios` wrapper):

```
plans:        Plan[]            // ordered; the comparison axis
activePlanId: string            // which plan drives the dashboard
expenses:     Expense[]         // SHARED pool, each tagged with .plans
properties:   Property[]        // SHARED pool, each tagged with .plans
categories:   Category[]        // SHARED
realDollars:  bool              // unchanged, already separate
schemaVersion: 2                // migration marker
```

**Plan shape**

```js
{
  id, name, icon, tone, baseline,         // identity / presentation
  // per-plan inputs (each plan is a full alternative world):
  age, retireAge, portfolio, ssAge, ssAnnual,
  nomReturn, inflation, marketMode,
  discretionaryCut, luxuryCut, cutMode,
  // housing configuration:
  actions: { [propId]: 'keep' | 'sell' | 'rent' },
  newHomeCost, transitionYears,
}
```

**Expense shape**: same as today **except `scenarios` is renamed to `plans`**:
`{ id, cat, name, amount, plans:[planId|'all'], tier, inflOverride?, ageMin?, ageMax? }`

**Property shape**: gains a membership tag:
`{ id, name, value, mortgage, rentMonthly, rentCostsAnnual, plans:[planId|'all'] }`
A property contributes to a plan's economics **only if** its `plans` includes that
plan id or `"all"`; for member properties the plan's `actions[propId]`
(keep/sell/rent) applies.

### Naming rules (apply everywhere)
- The word **"scenario" is banned** from code, identifiers, comments, and UI
  copy. Use **"plan"**.
- `expense.scenarios` → `expense.plans`. Engine params `scenario` → `planId`,
  `baselineScenario` → `baselinePlanId`. `lib/scenarioMeta.js` → `lib/planMeta.js`.
  `components/shell/ScenarioSwitcher.jsx` → `components/shell/PlanSwitcher.jsx`.
  Delete the unused `SCENARIO_LABELS` export.
- Per-plan input setters keep their names (`setAge`, `setPortfolio`,
  `setNomReturn`, `setMarketMode`, `setDiscretionaryCut`, …) — they now write to
  the **active plan**, so `ProfileSettings`, `MarketSettings`, and
  `DownturnCutControls` need **no changes**.

### `usePlanner()` API contract (Phase 1 must expose exactly this; Phases 2 consume it)
Unchanged keys still provided: `ready, endAge, realDollars, setRealDollars,
age, retireAge, portfolio, ssAge, ssAnnual, nomReturn, inflation, marketMode,
discretionaryCut, luxuryCut, cutMode, realRet,
categories, addCategory, removeCategory,
expenses, setExpenses,
properties, addProperty, updateProperty, removeProperty, propSaleNet, propRentalNet,
plans, activePlanId, activePlan, baselinePlan, activeEcon, setActivePlanId,
addPlan, updatePlan, removePlan, setPlanAction,
spendAt, spendNow, spend65, spend70, dispSpend65, dispSpend70,
projections, runsOut, altRunsOut, getD, effWR, fullChartData, fullReturnsTimeline`
plus all `set<Field>` setters for the per-plan input fields.

**Removed** (were only used by `ScenarioSwitcher`/`DataSettings` text):
`scenarios, activeScenario, activeId, switchScenario, createScenario,
renameScenario, deleteScenario`.

**Behavior of plan CRUD:**
- `addPlan(name?, { duplicateFrom } = {})` → creates a plan (auto icon/tone, blank
  housing + `PLANNER_DEFAULTS` inputs, or a deep copy of `duplicateFrom`'s
  inputs+housing), appends it, sets it active, returns its id.
- `updatePlan(id, patch)` → shallow-merges; if `patch.baseline === true`, clears
  `baseline` on all other plans (only one baseline).
- `removePlan(id)` → no-op if it's the last plan; if it was baseline, promote the
  first remaining to baseline; **strip the id from every `expense.plans` and
  `property.plans`** (fall back to `["all"]` if a tag list becomes empty); if it
  was active, switch active to the baseline (or first) plan.
- `setPlanAction(planId, propId, action)` unchanged.

### Constraints
- Persistence writes go through the existing atomic `mutateData`-style pattern —
  **never fire two store setters in one event** (the functional updater resolves
  against a captured snapshot, so a second setter clobbers the first). Compound
  edits = one write.
- Keep the existing single-active-plan dashboard projection (active plan vs.
  market-regime alt). Multi-plan chart overlay is **out of scope**.
- Per-plan "portfolio holdings as taggable line-items" is **out of scope**;
  portfolio stays a per-plan scalar.

### Definition of done (every agent, before reporting back)
- `cd client && npm run build` succeeds.
- `cd client && npm test` passes (Phase 1 keeps `engine.test.js` green).
- `grep -rin scenario client/src` returns **zero** matches in files you own.
- Report exactly which files you changed and any contract deviation.

---

## PHASE 1 — Foundation (ONE agent, must land before Phase 2)

**Goal:** Replace the scenario/housing-plan data model with the unified `Plan`
model, migrate saved data, and expose the new `usePlanner()` contract.

**Files you own (do not touch any others):**
- `client/src/engine.js`
- `client/src/engine.test.js`
- `client/src/state/PlannerProvider.jsx`
- `client/src/lib/scenarioMeta.js` → rename to `client/src/lib/planMeta.js` (`git mv`)

**Steps**

1. **`engine.js`**
   - In `monthlySpendAtAge` and `project`: read `e.plans` instead of
     `e.scenarios`; rename the `scenario` param to `planId` and
     `baselineScenario` to `baselinePlanId`. Keep all math identical.
   - The legacy string special-cases (`planId === "sell_move"` / `"stay"` /
     `"rent_out"` and `retainedRE`) are inert (the app never passes `retainedRE`).
     Leave them so the RE tests keep passing, but update the comment to say they
     are legacy/back-compat only.
   - In `DEFAULT_EXPENSES`, rename every `scenarios:` key to `plans:` (values
     unchanged: `["all"]`, `["stay"]`, `["sell_move","rent_out"]`).
   - Delete the unused `SCENARIO_LABELS` export. Update all "scenario" comments to
     "plan".
   - Keep exporting `DEFAULT_CATEGORIES`, `DEFAULT_EXPENSES`, `uid`, `fmt`,
     `fmtFull`, `deflate`, `project`, `monthlySpendAtAge`, `buildReturns`,
     `returnForYear`, `shouldApplyCut`, `LOST_DECADE`, `COLOR_OPTIONS`.

2. **`engine.test.js`**
   - Rename `scenarios:` → `plans:` in every fixture object. Rename the test
     titles/comments that say "scenario" → "plan". Assertions and numbers stay
     identical. `npm test` must be green.

3. **`lib/scenarioMeta.js` → `lib/planMeta.js`**
   - `git mv` the file. Keep the same exports (`ACTION_META`, `planColor`,
     `tagColor`, `tagLabel`). Update comments: "expense scenario tag" → "expense
     plan tag".

4. **`state/PlannerProvider.jsx`** — the core rewrite.
   - **State:** replace `usePersistedState("scenarios")` /
     `usePersistedState("activeScenarioId")` with root keys:
     `plans` (array), `activePlanId`, `expenses`, `properties`, `categories`,
     and a `schemaVersion` key. Keep `realDollars` as-is.
   - **`PLANNER_DEFAULTS`:** split into (a) per-plan defaults
     (`age, retireAge, portfolio, ssAge, ssAnnual, nomReturn, inflation,
     marketMode, discretionaryCut, luxuryCut, cutMode, actions, newHomeCost,
     transitionYears`) and (b) shared defaults (`categories, expenses,
     properties`). Build the three default plans (Stay/Sell+relocate/Rent-out
     from the current `SEED_HOUSING`), each carrying the per-plan defaults; give
     default `properties` a `plans:["all"]` tag; rename `DEFAULT_EXPENSES` tags
     are already `plans` from step 1.
   - **Setters:** keep generic `set<Field>` setters, but route per-plan input
     fields to the **active plan** object inside `plans` (single atomic write),
     and route `expenses`/`properties`/`categories` to their root keys. Keep
     `setExpenses` writing the shared `expenses` array.
   - **Plan CRUD:** implement `addPlan`, `updatePlan`, `removePlan`,
     `setActivePlanId`, `setPlanAction` per the MASTER CONTEXT. Reuse
     `PLAN_TONES` / `PLAN_ICONS` for auto-assignment. Keep `addProperty`,
     `updateProperty`, `removeProperty` (properties now carry `plans`; new
     properties default to `plans:["all"]`). `removeProperty` must also delete the
     prop from every plan's `actions`.
   - **Economics:** in `planEconomics`, only include a property if its `plans`
     includes the plan id or `"all"`. Everything else (sale net, rental net,
     relocates, transition) unchanged.
   - **Projections / spend:** pass `planId: activePlanId` and
     `baselinePlanId: baselinePlan.id` to `project`; read inputs from the active
     plan. Keep `preMovePlanId`, `spendAt`, chart data, `effWR`, etc. identical
     in behavior.
   - **Migration (`migrateToV2`, runs once when `schemaVersion !== 2`):**
     - **Already v2** (`schemaVersion === 2`): no-op.
     - **Has old `scenarios` map:** sort scenarios by `createdAt`; let
       `multi = count > 1`. For each scenario `S` (apply the existing
       `upgradeData` to `S.data` first) and each housing plan `HP` in
       `S.data.plans`, emit a Plan:
       `id = multi ? uid() : HP.id`,
       `name = multi ? "<S.name> · <HP.name>" : HP.name`,
       carry `icon,tone,baseline,actions,newHomeCost,transitionYears` from `HP`
       and `age,retireAge,portfolio,ssAge,ssAnnual,nomReturn,inflation,
       marketMode,discretionaryCut,luxuryCut,cutMode` from `S.data`.
       Build a per-scenario `oldHPid → newPlanId` map. Then:
       - Expenses: union all `S.data.expenses`; for each, set
         `plans = remap(e.scenarios)` (`"all"` → `["all"]` for single scenario,
         else the scenario's new plan ids; otherwise map known ids, drop unknown,
         fall back to `["all"]`/scenario ids if empty) and delete `e.scenarios`.
       - Properties: union all `S.data.properties`; tag
         `plans = multi ? <S's new plan ids> : ["all"]`.
       - `categories` = active scenario's (or first) categories.
       - `activePlanId` = remap of the active scenario's `data.activePlanId`
         (unchanged id in the single-scenario case).
       (Single-scenario common case therefore reduces to: hoist the active
       scenario's data to root, its housing plans become root plans with the
       scenario's scalars, expense `scenarios`→`plans` with ids intact,
       properties get `plans:["all"]`.)
     - **No `scenarios` but legacy top-level keys / fresh:** synthesize one
       scenario from legacy keys via the existing `upgradeData`, then run the
       branch above; or seed from defaults if empty.
     - Write the new root keys + `schemaVersion: 2` in **one** pass; you may leave
       the old `scenarios`/`activeScenarioId` keys (harmless) or clear them.
   - Keep `usePlanner()` returning the **exact** contract in MASTER CONTEXT.

**Acceptance:** `npm test` green; `npm run build` ok; loading existing saved data
(a single "My Plan" scenario with Stay/Sell/Rent housing plans) yields three
top-level plans with identical dashboard numbers; `grep -rin scenario
client/src/engine.js client/src/state client/src/lib` is empty.

---

## PHASE 2A — Top-bar plan switcher + nav (parallel)

**Files you own:** `client/src/components/shell/ScenarioSwitcher.jsx` (→ rename to
`PlanSwitcher.jsx` via `git mv`), `client/src/components/shell/TopBar.jsx`,
`client/src/components/shell/Sidebar.jsx`.

**Steps**
- Rename the component/file to `PlanSwitcher`. Rewrite it against the new API:
  use `plans` (array), `activePlanId`, `activePlan`, `setActivePlanId`,
  `addPlan`, `updatePlan`, `removePlan`. Map switch → `setActivePlanId(id)`;
  "New" → `addPlan(name)`; "Duplicate current" →
  `addPlan(\`\${activePlan.name} copy\`, { duplicateFrom: activePlanId })`;
  "Rename current" → `updatePlan(activePlanId, { name })`; "Delete current" →
  `removePlan(activePlanId)` (guard: keep when `plans.length <= 1`). Show
  `activePlan?.name`. Replace all "scenario" copy with "plan". Render each plan
  row with its `icon`.
- `TopBar.jsx`: update the import and `<PlanSwitcher />` usage.
- `Sidebar.jsx`: change the `plan` nav label from **"Housing Plan"** to
  **"Plans"** (keep the house icon).

---

## PHASE 2B — Plan tab (parallel)

**Files you own:** `client/src/views/PlanView.jsx`,
`client/src/components/plans/PlanCard.jsx`,
`client/src/components/plans/PlanEditor.jsx`.

**Steps**
- `PlanView.jsx`: change the title from **"Housing Plans"** to **"Plans"** and the
  subtitle to describe plans as full alternatives you compare (housing + tagged
  expenses/assets). "New plan" still calls `addPlan()` then opens the editor.
  Cards still select the active plan and show the impact panel for `activePlan`.
  Update the delete confirm copy to say "plan" (expenses/assets tagged to it
  revert to All).
- `PlanCard.jsx` / `PlanEditor.jsx`: update the import path
  `../../lib/scenarioMeta.js` → `../../lib/planMeta.js`. No behavioral change
  required. (Optional, only if quick: in `PlanEditor`, add a one-line note that
  profile/market inputs for this plan are edited under Assumptions while it is the
  active plan — do **not** build new input fields here.)

---

## PHASE 2C — Expenses (parallel)

**Files you own:** `client/src/views/ExpensesView.jsx`,
`client/src/components/expenses/ExpenseRow.jsx`,
`client/src/components/expenses/AddExpenseForm.jsx`.

**Steps**
- Replace every read/write of `exp.scenarios` / `draft.scenarios` with `.plans`.
  Rename local helpers `toggleScenario` → `togglePlan`, `scenarioActive` →
  `planActive`. Keep the `["all"]` sentinel semantics identical.
- Update import paths `../../lib/scenarioMeta.js` → `../../lib/planMeta.js`.
- UI copy: the chip label "All plans" stays; the subtitle "Tag each expense by
  plan…" stays; ensure no "scenario" text remains. The per-plan toggle chips
  iterate `plans` exactly as today.
- `ExpensesView` greying logic uses `exp.plans` against `activePlanId`.

---

## PHASE 2D — Assumptions, Properties, Dashboard, App shell (parallel)

**Files you own:** `client/src/views/SettingsView.jsx`,
`client/src/components/settings/PropertySettings.jsx`,
`client/src/components/settings/DataSettings.jsx`,
`client/src/views/DashboardView.jsx`, `client/src/App.jsx`.

**Steps**
- `SettingsView.jsx`: subtitle "Changes apply to the active **scenario**" →
  "active **plan**".
- `PropertySettings.jsx`: add a **per-plan membership toggle** to each property
  editor, mirroring the expense pattern — a row of chips ("All" + one per plan
  from `usePlanner().plans`, colored via `planColor` from `lib/planMeta.js`) that
  edits `property.plans` through `updateProperty(p.id, { plans })`. New properties
  already default to `["all"]` (Phase 1). Update the card subtitle to mention
  that each plan decides whether a property is included and kept/sold/rented.
- `DataSettings.jsx`: replace "scenario"/"scenarios" copy with "plan"/"plans".
- `DashboardView.jsx`: it already reads `activePlan`/`activeEcon`; just ensure no
  "scenario" strings remain (the `housingLabel` is fine). No logic change.
- `App.jsx`: loader text "Preparing scenarios…" → "Preparing plans…".

---

## PHASE 3 — Integration & verification (ONE agent, after Phase 2)

**Goal:** prove the merge is complete and consistent.
- `cd client && npm install && npm run build && npm test` — all green.
- `grep -rin scenario client/src` → **zero** matches (code, comments, UI copy).
- Sanity-check migration by hand: with a saved single-scenario store (one "My
  Plan" + Stay/Sell/Rent housing plans), confirm three plans appear in the
  switcher and the Plans tab, the active plan's dashboard numbers match
  pre-merge, expense plan-tags still resolve, and property plan-toggles work.
- Fix any cross-file integration gaps (import paths, removed API usages).
- Report a short summary of the final state and anything deferred.

---

## Decisions baked in (flag to the user if any should change)
- **Each plan owns its own inputs** (profile/market/portfolio/cuts), so each old
  scenario migrates losslessly and plans are full alternatives. (Alternative:
  global shared inputs — simpler, but loses per-scenario differences.)
- **Migration is lossless**: every scenario's housing plans become top-level
  plans; multi-scenario stores get `"<Scenario> · <Plan>"` names and union their
  expenses/properties (no dedup in v1).
- **Properties become a shared pool with a `plans` membership tag** + per-plan
  keep/sell/rent action.
- Out of scope: multi-plan chart overlay; itemized portfolio holdings tagged to
  plans.
