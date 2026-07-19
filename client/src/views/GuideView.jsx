import { useRef } from "react";
import { useTheme } from "../theme/ThemeProvider.jsx";
import { usePersistedState } from "../usePersistedState.jsx";
import { SectionTitle, Card, Badge, Tag, Button } from "../components/ui.jsx";
import { FS, RAD, FW } from "../lib/styles.js";

/* ─────────────────────────────────────────────────────────────────────────
   In-app user guide. A single scrollable page that explains the whole app,
   with three deep-dive spotlights on the features that reward a closer look:
   tagging expenses & assets to plans, the flex spend (downturn) controls, and
   the Time Machine. Jump chips scroll to each section; "Open …" buttons switch
   the app view via the shared persisted `view` key (the same one App reads).
   ───────────────────────────────────────────────────────────────────────── */

// Sections advertised in the jump nav. `id` doubles as the scroll target.
const TOC = [
	{ id: "start", label: "Start here" },
	{ id: "plans", label: "Plans" },
	{ id: "tagging", label: "★ Tagging to plans" },
	{ id: "flex", label: "★ Flex spend controls" },
	{ id: "timemachine", label: "★ Time Machine" },
	{ id: "reference", label: "Everything else" },
	{ id: "faq", label: "Tips & FAQ" },
];

// Uppercase eyebrow label used above section headings.
function Eyebrow({ children, color }) {
	const S = useTheme();
	return (
		<div
			style={{
				fontSize: 10.5,
				fontWeight: FW.bold,
				color: color || S.textMuted,
				textTransform: "uppercase",
				letterSpacing: 0.7,
				marginBottom: 6,
			}}
		>
			{children}
		</div>
	);
}

// A section wrapper that registers a scroll target and renders a heading.
function Section({ id, refs, icon, title, sub, children, accent }) {
	const S = useTheme();
	const color = accent || S.text;
	return (
		<section
			ref={(el) => {
				if (refs) refs.current[id] = el;
			}}
			style={{ scrollMarginTop: 16 }}
		>
			<div style={{ display: "flex", alignItems: "center", gap: 11, marginBottom: sub ? 6 : 14 }}>
				{icon && (
					<span
						style={{
							fontSize: 19,
							width: 40,
							height: 40,
							borderRadius: 11,
							display: "inline-flex",
							alignItems: "center",
							justifyContent: "center",
							background: (accent || S.accent) + "1c",
							flexShrink: 0,
						}}
					>
						{icon}
					</span>
				)}
				<h2 style={{ fontSize: 19, fontWeight: FW.bold, color, letterSpacing: "-0.3px" }}>{title}</h2>
			</div>
			{sub && (
				<p style={{ fontSize: FS.base, color: S.textMuted, lineHeight: 1.6, margin: "0 0 16px", maxWidth: 720 }}>
					{sub}
				</p>
			)}
			{children}
		</section>
	);
}

// Numbered step used in the "how to" lists.
function Step({ n, title, children, color }) {
	const S = useTheme();
	const c = color || S.accent;
	return (
		<div style={{ display: "flex", gap: 13, alignItems: "flex-start" }}>
			<span
				style={{
					flexShrink: 0,
					width: 26,
					height: 26,
					borderRadius: "50%",
					background: c + "1e",
					border: `1.5px solid ${c}66`,
					color: c,
					fontSize: 12.5,
					fontWeight: FW.bold,
					fontFamily: S.mono,
					display: "inline-flex",
					alignItems: "center",
					justifyContent: "center",
					marginTop: 1,
				}}
			>
				{n}
			</span>
			<div style={{ flex: 1, minWidth: 0 }}>
				<div style={{ fontSize: FS.md, fontWeight: FW.semibold, color: S.text }}>{title}</div>
				{children && (
					<div style={{ fontSize: FS.base, color: S.textMuted, lineHeight: 1.6, marginTop: 3 }}>{children}</div>
				)}
			</div>
		</div>
	);
}

// A callout / tip strip.
function Callout({ icon = "💡", tone = "accent", children }) {
	const S = useTheme();
	const c = S[tone] || S.accent;
	return (
		<div
			style={{
				display: "flex",
				gap: 10,
				alignItems: "flex-start",
				padding: "11px 14px",
				borderRadius: RAD.md,
				background: c + "10",
				border: `1px solid ${c}33`,
				fontSize: FS.base,
				color: S.textMuted,
				lineHeight: 1.6,
			}}
		>
			<span style={{ fontSize: 15, lineHeight: 1.4, flexShrink: 0 }}>{icon}</span>
			<div>{children}</div>
		</div>
	);
}

// Emphasis pill used inline for UI labels the user will actually see.
function Ui({ children }) {
	const S = useTheme();
	return (
		<span
			style={{
				fontFamily: S.mono,
				fontSize: "0.86em",
				padding: "1px 6px",
				borderRadius: 6,
				background: S.bg,
				border: `1px solid ${S.border}`,
				color: S.text,
				whiteSpace: "nowrap",
			}}
		>
			{children}
		</span>
	);
}

// A highlighted, accent-framed spotlight card for the three headline features.
function Spotlight({ refs, id, icon, eyebrow, title, accent, onOpen, openLabel, children }) {
	const S = useTheme();
	return (
		<section
			ref={(el) => {
				if (refs) refs.current[id] = el;
			}}
			style={{ scrollMarginTop: 16 }}
		>
			<Card
				style={{
					padding: 0,
					overflow: "hidden",
					border: `1px solid ${accent}44`,
					boxShadow: `0 0 0 1px ${accent}18, ${S.shadowSm}`,
				}}
			>
				{/* Accent header band */}
				<div
					style={{
						display: "flex",
						alignItems: "center",
						gap: 14,
						padding: "16px 20px",
						background: `linear-gradient(135deg, ${accent}18, ${accent}06)`,
						borderBottom: `1px solid ${accent}22`,
						flexWrap: "wrap",
					}}
				>
					<span
						style={{
							fontSize: 22,
							width: 46,
							height: 46,
							borderRadius: 13,
							display: "inline-flex",
							alignItems: "center",
							justifyContent: "center",
							background: accent + "22",
							border: `1px solid ${accent}44`,
							flexShrink: 0,
						}}
					>
						{icon}
					</span>
					<div style={{ flex: 1, minWidth: 180 }}>
						<Eyebrow color={accent}>{eyebrow}</Eyebrow>
						<div style={{ fontSize: 17, fontWeight: FW.bold, color: S.text, letterSpacing: "-0.3px" }}>{title}</div>
					</div>
					{onOpen && (
						<Button variant="primary" size="sm" onClick={onOpen} style={{ background: accent, borderColor: accent }}>
							{openLabel} →
						</Button>
					)}
				</div>
				<div style={{ padding: "18px 20px", display: "grid", gap: 16 }}>{children}</div>
			</Card>
		</section>
	);
}

/* ── Small presentational helpers reused across sections ─────────────────── */

// Feature card for the reference grid.
function RefCard({ icon, title, color, onOpen, openLabel = "Open", children }) {
	const S = useTheme();
	return (
		<Card style={{ display: "flex", flexDirection: "column", gap: 9 }}>
			<div style={{ display: "flex", alignItems: "center", gap: 9 }}>
				<span style={{ fontSize: 17 }}>{icon}</span>
				<span style={{ fontSize: FS.md, fontWeight: FW.semibold, color: S.text }}>{title}</span>
			</div>
			<p style={{ fontSize: FS.sm, color: S.textMuted, lineHeight: 1.6, margin: 0, flex: 1 }}>{children}</p>
			{onOpen && (
				<div>
					<Button variant="ghost" size="sm" onClick={onOpen} style={{ color: color || S.accent, padding: "4px 0" }}>
						{openLabel} →
					</Button>
				</div>
			)}
		</Card>
	);
}

// One Q/A row for the FAQ.
function Qa({ q, children }) {
	const S = useTheme();
	return (
		<div style={{ padding: "13px 0", borderBottom: `1px solid ${S.border}` }}>
			<div style={{ fontSize: FS.md, fontWeight: FW.semibold, color: S.text, marginBottom: 4 }}>{q}</div>
			<div style={{ fontSize: FS.base, color: S.textMuted, lineHeight: 1.6 }}>{children}</div>
		</div>
	);
}

/* ── Page ────────────────────────────────────────────────────────────────── */
export default function GuideView() {
	const S = useTheme();
	const refs = useRef({});
	// Same persisted key App uses, so setting it switches the visible view.
	const [, setView] = usePersistedState("view", "dashboard");

	const go = (id) => {
		const el = refs.current[id];
		if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
	};
	const open = (view) => () => setView(view);

	return (
		<div className="fade-in" style={{ display: "grid", gap: 22 }}>
			<SectionTitle sub="Everything PlanFIRE can do, in one place — from your first plan to replaying a century of market history on your portfolio.">
				User Guide
			</SectionTitle>

			{/* Jump nav */}
			<div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
				{TOC.map((t) => (
					<button
						key={t.id}
						onClick={() => go(t.id)}
						style={{
							cursor: "pointer",
							padding: "6px 13px",
							borderRadius: RAD.pill,
							border: `1.5px solid ${S.border}`,
							background: S.card,
							color: S.textMuted,
							fontSize: FS.sm,
							fontWeight: FW.medium,
							fontFamily: S.font,
							transition: "all .14s ease",
						}}
						onMouseEnter={(e) => {
							e.currentTarget.style.borderColor = S.accent;
							e.currentTarget.style.color = S.accent;
						}}
						onMouseLeave={(e) => {
							e.currentTarget.style.borderColor = S.border;
							e.currentTarget.style.color = S.textMuted;
						}}
					>
						{t.label}
					</button>
				))}
			</div>

			{/* ── Start here ──────────────────────────────────────────────────── */}
			<Section
				id="start"
				refs={refs}
				icon="🚀"
				title="Start here"
				accent={S.accent}
				sub="PlanFIRE models your runway to financial independence: what you own, what you earn, what you spend, and how markets treat you along the way. You can be productive in four steps."
			>
				<Card>
					<div style={{ display: "grid", gap: 16 }}>
						<Step n="1" title="Add your assets">
							Go to <Ui>Assets</Ui> and enter your accounts — cash, brokerage, retirement, real estate. Liquid
							accounts form the portfolio that grows; homes are modeled per plan.
						</Step>
						<Step n="2" title="Add your income & expenses">
							Under <Ui>Income</Ui> add salary, Social Security, pensions or rental income. Under <Ui>Expenses</Ui>{" "}
							add your monthly spending, tagged by category and priority.
						</Step>
						<Step n="3" title="Build a plan (or a few)">
							Open <Ui>Plans</Ui> to describe a strategy — e.g. <em>Stay put</em>, <em>Sell &amp; downsize</em>,{" "}
							<em>Rent it out</em>. Each plan decides what happens to every property.
						</Step>
						<Step n="4" title="Read the Dashboard">
							The <Ui>Dashboard</Ui> shows your withdrawal rate, when the money lasts to, FIRE milestones, and a
							Monte-Carlo success probability — updating live as you change inputs.
						</Step>
					</div>
				</Card>
				<div style={{ marginTop: 14 }}>
					<Callout icon="🧭">
						Your data saves automatically — to the server when you're signed in, or to this device as a guest. Watch the{" "}
						<strong>Plan health</strong> badge in the sidebar for an at-a-glance verdict.
					</Callout>
				</div>
			</Section>

			{/* ── Plans (core concept) ────────────────────────────────────────── */}
			<Section
				id="plans"
				refs={refs}
				icon="🗺️"
				title="Plans — the spine of everything"
				accent={S.blue}
				sub="A plan is a complete what-if scenario. Because expenses and assets are tagged by plan, one set of inputs can power many futures — and you compare them side by side instead of keeping spreadsheets."
			>
				<Card>
					<div style={{ display: "grid", gap: 14 }}>
						<div style={{ fontSize: FS.base, color: S.textMuted, lineHeight: 1.65 }}>
							Every plan carries its own name, icon and color. For each property you own, a plan chooses one of three
							actions:
						</div>
						<div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
							<Badge color={S.textMuted}>• Keep</Badge>
							<Badge color={S.accent}>↑ Sell</Badge>
							<Badge color={S.blue}>↻ Rent</Badge>
						</div>
						<div style={{ fontSize: FS.base, color: S.textMuted, lineHeight: 1.65 }}>
							Plans can also add a new-home purchase with a transition delay. Switch the active plan any time from the{" "}
							<strong>plan switcher</strong> in the top bar — every chart, milestone and probability recomputes for
							that plan. Use the <Ui>Plans</Ui> page to duplicate a plan and tweak one variable to see its impact in
							isolation.
						</div>
					</div>
				</Card>
				<div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" }}>
					<Button variant="secondary" size="sm" onClick={open("plan")}>
						Open Plans →
					</Button>
				</div>
			</Section>

			{/* ── ★ Spotlight: Tagging ────────────────────────────────────────── */}
			<Spotlight
				refs={refs}
				id="tagging"
				icon="🏷️"
				eyebrow="Featured"
				title="Tag expenses & assets to plans"
				accent={S.accent}
				onOpen={open("expenses")}
				openLabel="Open Expenses"
			>
				<p style={{ fontSize: FS.base, color: S.textMuted, lineHeight: 1.65, margin: 0, maxWidth: 720 }}>
					Tagging is what makes one dataset serve many plans. Every expense and every asset carries an{" "}
					<strong>“Applies to which plans?”</strong> control — a row of chips with <Ui>All plans</Ui> plus one chip per
					plan you've created. What you tag decides what each plan counts.
				</p>

				<div style={{ display: "grid", gap: 18, gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))" }}>
					<div style={{ display: "grid", gap: 12 }}>
						<Eyebrow color={S.accent}>How tagging behaves</Eyebrow>
						<Step n="1" title="All plans (the default)">
							Leave an item on <Ui>All plans</Ui> and it's counted in every scenario — groceries, utilities, your
							core brokerage account.
						</Step>
						<Step n="2" title="Specific plans only">
							Tap one or more plan chips and the item is counted <em>only</em> in those plans. Picking a specific
							plan drops <Ui>All</Ui> automatically.
						</Step>
						<Step n="3" title="Mix and match">
							An expense can belong to several plans at once — e.g. a boat slip that exists in <em>Stay put</em> and{" "}
							<em>Coastal</em> but not <em>Downsize</em>.
						</Step>
					</div>

					<div style={{ display: "grid", gap: 12 }}>
						<Eyebrow color={S.accent}>Why it matters</Eyebrow>
						<div style={{ fontSize: FS.base, color: S.textMuted, lineHeight: 1.65 }}>
							Tagging turns a single expense list into a real comparison engine. A mortgage tagged only to{" "}
							<em>Stay put</em> disappears the moment you switch to <em>Sell &amp; downsize</em> — no duplicate
							scenarios, no re-entry.
						</div>
						<Callout icon="🏠" tone="warning">
							<strong>Assets tag the same way.</strong> Liquid accounts (cash, brokerage, retirement) only fund the
							portfolio in the plans they're tagged to. Real estate goes a step further: each plan independently marks
							a property as <Tag color={S.textMuted}>Keep</Tag> <Tag color={S.accent}>Sell</Tag>{" "}
							<Tag color={S.blue}>Rent</Tag>, with its own sale proceeds and rental economics.
						</Callout>
					</div>
				</div>

				<Callout icon="💡">
					Totals on the <Ui>Assets</Ui> and <Ui>Expenses</Ui> pages always reflect the <em>active</em> plan, so the
					numbers you see are exactly what's feeding the current projection. Switch plans in the top bar to watch them
					change.
				</Callout>
			</Spotlight>

			{/* ── ★ Spotlight: Flex spend controls ────────────────────────────── */}
			<Spotlight
				refs={refs}
				id="flex"
				icon="📉"
				eyebrow="Featured"
				title="Flex spend controls"
				accent={S.warning}
				onOpen={open("dashboard")}
				openLabel="Open Dashboard"
			>
				<p style={{ fontSize: FS.base, color: S.textMuted, lineHeight: 1.65, margin: 0, maxWidth: 720 }}>
					Real retirees don't spend the same in a crash as in a boom — they tighten the belt. Flex spend controls model
					that discipline so your plan isn't judged on rigid, worst-case spending it would never actually maintain.
				</p>

				<div style={{ display: "grid", gap: 18, gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))" }}>
					<div style={{ display: "grid", gap: 12 }}>
						<Eyebrow color={S.warning}>Step 1 · Tier every expense</Eyebrow>
						<div style={{ fontSize: FS.base, color: S.textMuted, lineHeight: 1.65 }}>
							When you add an expense you set <strong>how essential</strong> it is. Each tier reacts differently to a
							downturn:
						</div>
						<div style={{ display: "grid", gap: 8 }}>
							<div style={{ display: "flex", gap: 9, alignItems: "baseline" }}>
								<Badge color={S.accent}>🛡️ Essential</Badge>
								<span style={{ fontSize: FS.sm, color: S.textMuted }}>Always funded — never trimmed.</span>
							</div>
							<div style={{ display: "flex", gap: 9, alignItems: "baseline" }}>
								<Badge color={S.warning}>⚠️ Discretionary</Badge>
								<span style={{ fontSize: FS.sm, color: S.textMuted }}>Trimmed first when markets drop.</span>
							</div>
							<div style={{ display: "flex", gap: 9, alignItems: "baseline" }}>
								<Badge color={S.danger}>💎 Luxury</Badge>
								<span style={{ fontSize: FS.sm, color: S.textMuted }}>Cut the most — nice-to-haves like big trips.</span>
							</div>
						</div>
					</div>

					<div style={{ display: "grid", gap: 12 }}>
						<Eyebrow color={S.warning}>Step 2 · Set the cuts</Eyebrow>
						<div style={{ fontSize: FS.base, color: S.textMuted, lineHeight: 1.65 }}>
							On the <Ui>Dashboard</Ui>, the <strong>Downturn spending controls</strong> card gives you two sliders —
							how deep to cut <em>Discretionary</em> and <em>Luxury</em> spending (0–100% each). Essentials stay
							untouched.
						</div>
						<div style={{ fontSize: FS.base, color: S.textMuted, lineHeight: 1.65 }}>
							Then choose <strong>when</strong> the cuts apply:
						</div>
						<div style={{ display: "grid", gap: 7 }}>
							<div style={{ fontSize: FS.sm, color: S.textMuted }}>
								<Ui>Downturn + recovery</Ui> — belt-tightening kicks in only during down markets and while
								recovering.
							</div>
							<div style={{ fontSize: FS.sm, color: S.textMuted }}>
								<Ui>All years</Ui> — a permanently leaner budget across the whole projection.
							</div>
						</div>
					</div>
				</div>

				<Callout icon="🎯" tone="warning">
					Flex spending is one of the most powerful levers you have. A plan that looks shaky at full spend can become
					resilient when discretionary and luxury spending flex down in bad years — because the biggest damage from a
					crash is selling assets while they're cheap. Try modest cuts first and watch your success probability move.
				</Callout>
			</Spotlight>

			{/* ── ★ Spotlight: Time Machine ───────────────────────────────────── */}
			<Spotlight
				refs={refs}
				id="timemachine"
				icon="⏳"
				eyebrow="Featured"
				title="The Time Machine"
				accent={S.blue}
				onOpen={open("markets")}
				openLabel="Open Markets"
			>
				<p style={{ fontSize: FS.base, color: S.textMuted, lineHeight: 1.65, margin: 0, maxWidth: 720 }}>
					Averages hide the thing that actually breaks retirements: the <em>order</em> returns arrive in. The Time
					Machine replays real market history — every year since 1928 — on <strong>your</strong> portfolio, so you can
					see how you'd have fared living through it.
				</p>

				<div style={{ display: "grid", gap: 18, gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))" }}>
					<div style={{ display: "grid", gap: 12 }}>
						<Eyebrow color={S.blue}>How to use it</Eyebrow>
						<Step n="1" title="Pick an era" color={S.blue}>
							Choose the <Ui>Time Machine</Ui> regime on the <Ui>Markets</Ui> page, then tap a famous window —
							Stagflation, the Long Bull, the Lost Decade, the GFC — or drag the start/end sliders to any custom span.
						</Step>
						<Step n="2" title="Set your allocation" color={S.blue}>
							Spread across stocks, Treasury &amp; corporate bonds, real estate, gold and cash. Use a preset
							(Balanced, 60/40, Aggressive…) or hit <Ui>⌖ Match my assets</Ui> to mirror what you actually hold.
						</Step>
						<Step n="3" title="Read the outcome" color={S.blue}>
							Every asset class shows its real CAGR, total growth and worst drawdown for that window, and your blended
							mix reports a combined return before and after inflation.
						</Step>
					</div>

					<div style={{ display: "grid", gap: 12 }}>
						<Eyebrow color={S.blue}>What it drives</Eyebrow>
						<div style={{ fontSize: FS.base, color: S.textMuted, lineHeight: 1.65 }}>
							The replayed era feeds your real projection year by year — not a smooth average, but the actual highs,
							crashes and recoveries in sequence. That's the honest stress test for <em>sequence-of-returns risk</em>.
						</div>
						<div style={{ fontSize: FS.base, color: S.textMuted, lineHeight: 1.65 }}>
							Toggle <Ui>Loop this era for the whole retirement</Ui> to repeat the window's returns for the full
							horizon; leave it off and your portfolio continues at the steady return once the era ends.
						</div>
						<Callout icon="📚" tone="blue">
							The dataset is nominal total returns by asset class, 1928–2025, sourced from Damodaran (NYU Stern),
							Shiller / Case-Shiller and the BLS. It ships with the app, so a data reset never touches it.
						</Callout>
					</div>
				</div>
			</Spotlight>

			{/* ── Everything else ─────────────────────────────────────────────── */}
			<Section
				id="reference"
				refs={refs}
				icon="🧩"
				title="Everything else"
				accent={S.purple}
				sub="The rest of the app at a glance. Each card jumps you straight there."
			>
				<div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))" }}>
					<RefCard icon="📊" title="Dashboard" color={S.accent} onOpen={open("dashboard")}>
						Your command center — withdrawal rate, depletion age, the portfolio projection through age 95, FIRE
						milestones and Monte-Carlo success probability, all live.
					</RefCard>
					<RefCard icon="💰" title="Income" color={S.accent} onOpen={open("income")}>
						Salary, Social Security, pensions and other income streams, each with its own start/stop ages so the
						timeline matches real life.
					</RefCard>
					<RefCard icon="🧾" title="Expenses" color={S.accent} onOpen={open("expenses")}>
						Monthly spending by custom category, tagged to plans, tiered by priority, with optional age ranges and
						per-item inflation overrides.
					</RefCard>
					<RefCard icon="🏦" title="Assets" color={S.warning} onOpen={open("assets")}>
						Everything you own, tagged by plan. Liquid accounts grow with the market; real estate is kept, sold or
						rented per plan.
					</RefCard>
					<RefCard icon="📈" title="Markets" color={S.blue} onOpen={open("markets")}>
						Choose how markets behave — a steady historical average, a Lost-Decade stress test, or the Time Machine —
						then set long-run return and inflation.
					</RefCard>
					<RefCard icon="🗺️" title="Plans" color={S.blue} onOpen={open("plan")}>
						Create, duplicate, rename and compare scenarios. Set each property to keep/sell/rent and add a new-home
						purchase with a transition delay.
					</RefCard>
					<RefCard icon="✦" title="AI Co-pilot" color={S.purple} onOpen={open("copilot")}>
						A chat assistant grounded in your real numbers. Ask questions and get one-tap changes — e.g. “Retire at 57”
						— applied straight to your plan.
					</RefCard>
					<RefCard icon="⚙️" title="Settings" color={S.textMuted} onOpen={open("settings")}>
						Profile, account, notifications, privacy &amp; data (export / import / reset), appearance (light / dark /
						system) and experimental Labs flags.
					</RefCard>
				</div>
			</Section>

			{/* ── FAQ ─────────────────────────────────────────────────────────── */}
			<Section id="faq" refs={refs} icon="💬" title="Tips & FAQ" accent={S.accent}>
				<Card>
					<Qa q="How do I compare two strategies fairly?">
						Build both as plans, tag any expense or asset that differs between them, and switch plans in the top bar.
						Everything — charts, milestones, success probability — recomputes for the active plan, so you're comparing
						like for like.
					</Qa>
					<Qa q="My money runs out too early. What should I try first?">
						In order: raise the retirement age slightly, turn on flex spend controls (Discretionary/Luxury cuts), lower
						the withdrawal by trimming or age-gating luxury expenses, and check your Markets return isn't unrealistically
						low. The Co-pilot can suggest and apply these for you.
					</Qa>
					<Qa q="Is the Time Machine a prediction?">
						No — it's a replay of what actually happened. It answers “how would my portfolio have handled the 1970s /
						the GFC / a lost decade?”, which is a far better test of resilience than any single average return.
					</Qa>
					<Qa q="Where does my data live, and is it safe?">
						Signed in, it's saved per-user to the server and synced across your devices; as a guest it stays only on
						this device. Either way you can export a JSON backup any time from <Ui>Settings → Privacy &amp; Data</Ui>.
					</Qa>
					<Qa q="What do the plan-health colors mean?">
						They summarize the active plan's withdrawal rate and whether the money lasts. Green is comfortable, amber is
						tight, red means the projection depletes before age 95 — a cue to adjust spending, age, or allocation.
					</Qa>
				</Card>
				<div style={{ marginTop: 16, textAlign: "center" }}>
					<p style={{ fontSize: FS.base, color: S.textMuted, marginBottom: 12 }}>Ready to put it to work?</p>
					<div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
						<Button variant="primary" onClick={open("dashboard")}>
							Go to the Dashboard
						</Button>
						<Button variant="secondary" onClick={open("copilot")}>
							Ask the Co-pilot
						</Button>
					</div>
				</div>
			</Section>
		</div>
	);
}
