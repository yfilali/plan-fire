# PlanFIRE — UX Review

*Conducted 2026-07-22 by driving the rendered app (Chromium via Playwright) through the full user journey — landing page → login → guided setup → every tab → plan comparison → mobile — plus a pass over the User Guide's screenshots and demo clips. All findings below were observed visually on live pages; supporting captures are in `docs/ux-review/`.*

**Scope of what was exercised:** marketing landing page, login gate, guest mode, the 7-step setup wizard, Dashboard, Co-pilot (offline fallback), Income, Expenses (advanced options, categories modal, tier/tagging), Assets (liquid + real estate), Markets (all three regimes, Time Machine eras, allocation), Plans (create, compare, switcher menu), Guide, Settings (all tabs, theme switching), destructive-action confirmations, and the 390 px mobile layout in light and dark themes.

---

## Executive summary

PlanFIRE is in strong shape. The visual system is coherent and polished in both themes, the information architecture is clean (input tabs → engine → Dashboard), the copy explains *why* and not just *what*, empty/first-run flows exist, mobile works, and thoughtful touches abound — the plan-health badge that follows you everywhere, per-plan tagging chips repeated consistently across Income/Expenses/Assets, the in-app Guide with live demo widgets, a working offline fallback for the AI Co-pilot.

The issues found are concentrated in three places:

1. **The entry funnel demotes its best path** — both landing CTAs land on a login form, and "Continue as guest" is a small underlined afterthought, despite the FAQ promising you can try without signing up.
2. **Sliders are used for precise dollar amounts** in the wizard and Settings, which makes exact entry ("my portfolio is $823,000") impossible or fiddly.
3. **A handful of state-communication gaps** — creating a plan silently switches the whole app to it; "greyed-out = not in this plan" is contradicted by age-gated rows; nominal-dollars-by-default produces eye-popping $80M headlines.

Nothing observed rises to "broken." Prioritized list below.

---

## High-priority findings

### H1. Guest mode is buried under a login wall
**Where:** Landing → "Start planning free →" / "Open app" → `/login` (`landing-full.png`)
**What happens:** Both primary CTAs — including one literally labeled "free" — land on an email/password form. "Continue as guest" is a small underlined text link below two stronger actions. The landing FAQ ("Can I try it without signing up?") and the footer ("Private by design") both promise a friction-free trial the login screen then visually contradicts.
**Why it matters:** This is the single highest-leverage funnel point in the app. Every first-time visitor hits it before seeing any value.
**Suggestion:** Make "Try it — no account needed" a full-size primary button on the login card (or send "Start planning free" straight into guest mode with a later "save your data" upsell). Keep log-in for returning users.

### H2. Dollar amounts are entered with sliders
**Where:** Setup wizard "Your savings", "Income while you're still working", "Social Security"; Settings → Profile (`wizard-savings-slider.png`)
**What happens:** Portfolio balance, salary, bonus, RSUs, and SS benefit are slider-only. There is no way to type "$823,456"; the value you get depends on pixel-precision dragging (or knowing about arrow keys). The main app gets this right — Assets/Expenses/Income use proper numeric fields — so the wizard teaches an input pattern the app then abandons.
**Why it matters:** For a finance tool, the very first numbers a user enters are the ones they know to the dollar. Approximation here undermines trust in every projection that follows ("that's not actually my number").
**Suggestion:** Pair each slider with a small editable number field (slider for exploration, field for precision), as is already done for "New home purchase" in the plan editor.

### H3. Creating a plan silently switches the whole app to it
**Where:** Plans → "＋ New plan" (`new-plan-modal.png` — note the top bar behind the modal)
**What happens:** Clicking "＋ New plan" instantly creates "Plan 2", makes it the **active** plan, and opens a modal titled "Edit plan." Its defaults (retire at 49 "(now)", SS $40K @ 70) don't inherit from the user's current plan, so the moment the modal opens, the health chip, dashboard, and sidebar badge all recompute against a plan the user hasn't configured — visibly flashing to a different (sometimes At-risk/amber) state behind the modal.
**Why it matters:** Two surprises at once: a "new" action opening an "Edit" surface, and global state changing as a side effect of exploration. A user who clicks New plan just to look, then closes the modal, is now on a plan they never meant to adopt.
**Suggestion:** Either (a) don't activate until "Done", (b) inherit defaults from the currently active plan (which also makes "duplicate then tweak one variable" — the workflow the Guide recommends — the natural default), and (c) title the modal "New plan."

### H4. "Greyed-out = doesn't apply to this plan" is contradicted by age-gated rows
**Where:** Expenses list (`expenses-greyed-row.png`)
**What happens:** The page header says "Greyed-out rows don't apply to 'My Plan'." But a Travel expense tagged **All plans** with an age window of 55–80 also renders greyed (because the household is 45 today). Same visual state, different meaning — one is "never counted in this plan", the other is "counted, just not yet."
**Why it matters:** Tagging is the app's marquee concept; muddying its one visual signal undermines the mental model the Guide works hard to build. A user could reasonably conclude their Travel budget is being ignored.
**Suggestion:** Keep grey for "not in this plan"; give age-inactive rows a distinct treatment (e.g., normal contrast + the existing `55–80` chip highlighted, or a "starts @55" chip). Update the header copy either way.

---

## Medium-priority findings

### M1. First paint is blocked by third-party requests
**Where:** every page load (observed: content blocked ~10 s until `fonts.googleapis.com` / `va.vercel-scripts.com` timed out in a restricted-network environment)
**What happens:** The Google Fonts stylesheet is a render-blocking `<link>` in `<head>`; on a slow or filtered network the app shows a blank gradient until it resolves or times out. Speed Insights also logs a console error when unreachable.
**Suggestion:** Self-host the two fonts (or add `media="print" onload` / `font-display: swap` loading), and load analytics defensively. On a flaky connection this is the difference between "instant app" and "blank page".

### M2. The Categories modal ignores Escape (and scrim clicks)
**Where:** Expenses → Categories (`categories-modal.png`)
**What happens:** Escape does not close "Manage categories"; clicks pass to the scrim, which swallows them (verified: an automated click sequence stalled behind `.modal-scrim`). Only the × button closes it. The Edit-plan modal has the same ×-only pattern.
**Suggestion:** Close on Escape and scrim-click for all modals — standard expectations, and a keyboard-accessibility requirement.

### M3. Duplicate/Rename/Delete plan are only discoverable in the top-bar switcher
**Where:** Plans page cards vs. top-bar plan menu (`plan-switcher-menu.png`)
**What happens:** Plan cards offer Edit and a small ✕. The actions the Guide highlights — "Duplicate a plan and change one variable" — plus Rename and Delete live only in the plan-switcher dropdown in the top bar, a control users treat as "switch", not "manage".
**Suggestion:** Add Duplicate (and Rename) to each plan card or its Edit modal. Card ✕ and menu "Delete current" should share one styled confirm.

### M4. Destructive confirms are native browser dialogs
**Where:** Settings → Privacy & Data → "Reset all data" (native `confirm()`), plan deletion
**What happens:** A polished app suddenly speaks in the browser's unstyled voice for its most dangerous action. Native confirms also can't offer an "Export first" escape hatch, which is exactly what a user wiping data needs.
**Suggestion:** Use the app's modal with the consequence spelled out ("Deletes 2 plans, 3 expenses… Export a backup first?").

### M5. Nominal dollars by default produce implausible-looking headlines
**Where:** Dashboard stat cards & charts (`dashboard-light.png`: "Balance @ 90 — $80.7M"; success-probability panel "$456.4M optimistic")
**What happens:** Nominal $ is the default display, so a 45-year-old with $800K sees an $80M balance at 90 and a chart y-axis reaching $220M. The Today's-$ toggle exists but is one small segmented control among many.
**Why it matters:** Numbers that feel absurd erode trust in the engine even when they're mathematically right, and they bury the number users actually reason in (today's purchasing power).
**Suggestion:** Default to Today's $ (keep nominal as the opt-in), or at least annotate the headline card ("≈ $18.2M in today's $").

### M6. "100%" Monte-Carlo success reads as a guarantee
**Where:** Dashboard success panel, Plans compare table
**What happens:** 400 random paths all passing is displayed as a flat **100%**.
**Suggestion:** Cap the display at ">99%" — a retirement tool should never visually promise certainty.

### M7. Setup wizard "About you" defaults both ages to the same value
**Where:** Wizard step 2 (`wizard-intro.png`, step shown in review captures)
**What happens:** Current age and target retirement age both start at 49; the retirement slider's minimum tracks current age, so the initial state reads "retire now" until the user notices the second slider. The freshly created Plan 2 (H3) inherits this same "retire at 49 (now)" default.
**Suggestion:** Default retirement age to something aspirational-but-plausible (e.g., current age + 10, min 55) so the first projection isn't degenerate.

---

## Low-priority polish

- **L1 — Claiming-age default is 70** on the wizard's Social Security step. Defensible (max benefit) but most users claim earlier; 67 (FRA) is the least-surprising default. (`wizard-expenses-choice.png` shows the adjacent step's correct disabled-Continue pattern.)
- **L2 — Co-pilot offline replies don't address the question.** "(offline demo) Your withdrawal rate is 1.6%…" is returned for "Can I retire 3 years earlier?" (`copilot-offline.png`). The graceful fallback is great; a couple of canned templates keyed to the three suggested prompts would make it feel intentional rather than broken.
- **L3 — Suggested Co-pilot prompts don't match the plan.** "Can I retire 3 years earlier?" is sensible, but showing it alongside a plan already marked Healthy/1.6% WR is a missed personalization: prompts could reflect live state ("Could I retire at 55 instead of 60?").
- **L4 — Mobile drawer transparency.** The hamburger drawer is slightly translucent over content (`mobile-dashboard.png` companion capture); nav labels remain legible but the dimmed page text shows through the drawer's own whitespace. A solid surface would read cleaner.
- **L5 — Head-to-head defaults to "My Plan vs My Plan"** when two plans exist, yielding the tautological "My Plan leaves $118.7M more at age 100" against itself until changed. Default Plan B to the newest other plan.
- **L6 — Guide/marketing imagery is dark-theme-only** while the app defaults new users to light/system theme; the first-run app looks unlike every screenshot that sold it. Consider theme-matched imagery or defaulting the app to dark.
- **L7 — Zoom control labeling.** "ZOOM 45 ⟶ 100" reads as a percentage until you realize it's an age range; "AGE RANGE" would be self-explanatory.
- **L8 — Login form a11y nits:** password input lacks `autocomplete="current-password"` (Chrome logs a warning), and the guest link's small size doubles as a touch-target issue on mobile.
- **L9 — Milestone stacking.** With a healthy plan, "Coast-FIRE / Financial independence / $500k net worth" all show "age 45 · now" as three separate rows; collapsing achieved milestones ("Already reached ✓") would give the remaining ones more meaning.

---

## What's working well (keep these)

- **Plan-health badge + top-bar chip everywhere** — constant, glanceable feedback that every input matters. The live recompute on plan switch is the app's best moment.
- **Tagging chips repeated identically** across Income, Expenses, and Assets, with inline explanations ("Counted in every plan you compare") — the Guide's promise matches the UI exactly.
- **The Guide tab** is genuinely excellent: real screenshots, looping clips, live demo widgets, deep links ("Open Expenses →"), and honest copy. Few apps this size ship documentation this good.
- **Time Machine** is a standout feature with a clear three-step flow (era → allocation → outcome), strong per-asset-class summary cards, and the "Match my assets" bridge back to the user's real data.
- **Compare plans** table with per-row "BEST" highlights and a plain-language "Recommended" banner turns engine output into a decision.
- **Graceful degradation**: no database → guest mode still fully works; no API key → Co-pilot returns a labeled offline answer instead of an error.
- **Settings depth**: export/import JSON backup, guided-setup restart, AI-data-use toggle with plain-language privacy copy, currency/number-format/landing-tab preferences.
- **Empty-state and form ergonomics** in the main app: the add-forms keep category/tag context between adds, advanced options stay collapsed until needed, and real-estate cards compute net-if-sold / net-if-rented inline.

---

## Evidence captures (`docs/ux-review/`)

| File | Shows |
|---|---|
| `landing-full.png` | Full marketing page (CTAs → login wall, H1) |
| `wizard-intro.png` / `wizard-savings-slider.png` / `wizard-expenses-choice.png` | Setup wizard; slider-for-dollars (H2); correct disabled-Continue pattern |
| `dashboard-light.png` / `dashboard-dark.png` | Full dashboard both themes; nominal-$ headlines (M5), 100% success (M6) |
| `new-plan-modal.png` | "Edit plan" modal for a create action; amber app state behind scrim (H3) |
| `expenses-greyed-row.png` | Age-gated row rendered like an untagged row (H4) |
| `categories-modal.png` | Manage-categories modal (M2) |
| `plan-switcher-menu.png` | Duplicate/Rename/Delete hidden in switcher (M3) |
| `time-machine.png` | Time Machine, GFC era selected |
| `copilot-offline.png` | Offline fallback answer (L2) |
| `mobile-dashboard.png` | 390 px layout |
