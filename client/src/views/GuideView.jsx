import { useRef } from "react";
import { useTheme } from "../theme/ThemeProvider.jsx";
import { usePersistedState } from "../usePersistedState.jsx";
import { SectionTitle, Card, Badge, Tag, Button } from "../components/ui.jsx";
import { FS, RAD, FW } from "../lib/styles.js";

/* ─────────────────────────────────────────────────────────────────────────
   In-app user guide. A single scrollable, media-rich page that teaches the
   whole app. Real screen grabs + short looping screen-recordings (captured
   from the live app, served from /guide/*) illustrate every feature, with
   deep-dive spotlights on the three that reward a closer look: tagging
   expenses & assets to plans, the flex spend (downturn) controls, and the
   Time Machine. Jump chips scroll to each section; "Open …" buttons switch the
   app view via the shared persisted `view` key (the same one App reads).
   ───────────────────────────────────────────────────────────────────────── */

const ASSET = (name) => `/guide/${name}`;

// Sections advertised in the jump nav. `id` doubles as the scroll target.
const TOC = [
	{ id: "start", label: "Start here" },
	{ id: "plans", label: "Plans" },
	{ id: "tagging", label: "★ Tagging to plans" },
	{ id: "flex", label: "★ Flex spend controls" },
	{ id: "timemachine", label: "★ Time Machine" },
	{ id: "walkthroughs", label: "Feature walkthroughs" },
	{ id: "faq", label: "Tips & FAQ" },
];

/* ── Text helpers ─────────────────────────────────────────────────────────── */

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

/* ── Media ────────────────────────────────────────────────────────────────── */

// A faux app-window frame around a screenshot or clip — dots + a caption bar —
// so embedded media reads as "this is the actual app", not a random image.
function Frame({ children, label, accent }) {
	const S = useTheme();
	const c = accent || S.border;
	return (
		<div
			style={{
				borderRadius: 14,
				overflow: "hidden",
				border: `1px solid ${accent ? c + "55" : S.border}`,
				background: S.bg,
				boxShadow: S.shadow,
			}}
		>
			<div
				style={{
					display: "flex",
					alignItems: "center",
					gap: 8,
					padding: "8px 12px",
					borderBottom: `1px solid ${S.border}`,
					background: S.card,
				}}
			>
				<span style={{ display: "inline-flex", gap: 5 }}>
					<i style={{ width: 9, height: 9, borderRadius: "50%", background: "#ff5f57" }} />
					<i style={{ width: 9, height: 9, borderRadius: "50%", background: "#febc2e" }} />
					<i style={{ width: 9, height: 9, borderRadius: "50%", background: "#28c840" }} />
				</span>
				{label && (
					<span style={{ fontSize: 11, color: S.textDim, fontFamily: S.mono, marginLeft: 4 }}>{label}</span>
				)}
			</div>
			{children}
		</div>
	);
}

// A captioned screenshot.
function Shot({ src, alt, caption, label, accent, maxWidth }) {
	const S = useTheme();
	return (
		<figure style={{ margin: 0, maxWidth: maxWidth || "100%" }}>
			<Frame label={label} accent={accent}>
				<img
					src={ASSET(src)}
					alt={alt}
					loading="lazy"
					style={{ display: "block", width: "100%", height: "auto" }}
				/>
			</Frame>
			{caption && (
				<figcaption style={{ fontSize: FS.sm, color: S.textDim, marginTop: 8, lineHeight: 1.5 }}>
					{caption}
				</figcaption>
			)}
		</figure>
	);
}

// A captioned, autoplaying, looping screen-recording (muted — decorative).
function Clip({ src, poster, caption, label, accent, maxWidth }) {
	const S = useTheme();
	return (
		<figure style={{ margin: 0, maxWidth: maxWidth || "100%" }}>
			<Frame label={label} accent={accent}>
				<div style={{ position: "relative" }}>
					<video
						src={ASSET(src)}
						poster={poster ? ASSET(poster) : undefined}
						autoPlay
						loop
						muted
						playsInline
						preload="metadata"
						style={{ display: "block", width: "100%", height: "auto", background: S.bg }}
					/>
					<span
						style={{
							position: "absolute",
							top: 10,
							right: 10,
							display: "inline-flex",
							alignItems: "center",
							gap: 6,
							padding: "3px 9px",
							borderRadius: 20,
							background: "rgba(8,10,16,0.72)",
							color: "#fff",
							fontSize: 10.5,
							fontWeight: FW.bold,
							letterSpacing: 0.4,
							textTransform: "uppercase",
							backdropFilter: "blur(4px)",
						}}
					>
						<span style={{ width: 7, height: 7, borderRadius: "50%", background: accent || S.accent }} />
						Live demo
					</span>
				</div>
			</Frame>
			{caption && (
				<figcaption style={{ fontSize: FS.sm, color: S.textDim, marginTop: 8, lineHeight: 1.5 }}>
					{caption}
				</figcaption>
			)}
		</figure>
	);
}

/* ── Section scaffolding ──────────────────────────────────────────────────── */

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
				<div style={{ padding: "18px 20px", display: "grid", gap: 18 }}>{children}</div>
			</Card>
		</section>
	);
}

// Two-column layout that collapses on narrow screens (via the app's .col-2).
function Cols({ children }) {
	return (
		<div className="col-2" style={{ display: "grid", gap: 18, alignItems: "start" }}>
			{children}
		</div>
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

// A feature walkthrough: screenshot on one side, titled step list on the other.
function Walkthrough({ refs, id, icon, title, color, shot, shotCaption, shotLabel, onOpen, openLabel, intro, steps }) {
	const S = useTheme();
	return (
		<section
			ref={(el) => {
				if (refs) refs.current[id] = el;
			}}
			style={{ scrollMarginTop: 16 }}
		>
			<Card style={{ display: "grid", gap: 16 }}>
				<div style={{ display: "flex", alignItems: "center", gap: 11, flexWrap: "wrap" }}>
					<span
						style={{
							fontSize: 17,
							width: 36,
							height: 36,
							borderRadius: 10,
							display: "inline-flex",
							alignItems: "center",
							justifyContent: "center",
							background: color + "1e",
							flexShrink: 0,
						}}
					>
						{icon}
					</span>
					<h3 style={{ fontSize: 16, fontWeight: FW.bold, color: S.text }}>{title}</h3>
					<span style={{ flex: 1 }} />
					{onOpen && (
						<Button variant="ghost" size="sm" onClick={onOpen} style={{ color }}>
							{openLabel || "Open"} →
						</Button>
					)}
				</div>
				{intro && (
					<p style={{ fontSize: FS.base, color: S.textMuted, lineHeight: 1.6, margin: 0, maxWidth: 760 }}>{intro}</p>
				)}
				<Cols>
					<Shot src={shot} alt={title} caption={shotCaption} label={shotLabel} accent={color} />
					<div style={{ display: "grid", gap: 13 }}>
						{steps.map((s, i) => (
							<Step key={i} n={i + 1} title={s.title} color={color}>
								{s.body}
							</Step>
						))}
					</div>
				</Cols>
			</Card>
		</section>
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
		<div className="fade-in" style={{ display: "grid", gap: 24 }}>
			<SectionTitle sub="A guided tour of PlanFIRE — with real screen grabs and short clips of every feature, from your first plan to replaying a century of market history on your portfolio.">
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
				sub="PlanFIRE models your runway to financial independence: what you own, what you earn, what you spend, and how markets treat you along the way. Four steps get you a real answer."
			>
				<Cols>
					<Card style={{ display: "grid", gap: 15 }}>
						<Step n="1" title="Add your assets">
							Go to <Ui>Assets</Ui> and enter your accounts — cash, brokerage, retirement, real estate. Liquid
							accounts form the portfolio that grows; homes are modeled per plan.
						</Step>
						<Step n="2" title="Add income & expenses">
							Under <Ui>Income</Ui> add salary, Social Security or pensions. Under <Ui>Expenses</Ui> add your monthly
							spending, tagged by category and priority.
						</Step>
						<Step n="3" title="Build a plan (or a few)">
							Open <Ui>Plans</Ui> to describe a strategy — <em>Stay put</em>, <em>Sell &amp; downsize</em>,{" "}
							<em>Rent it out</em>. Each plan decides what happens to every property.
						</Step>
						<Step n="4" title="Read the Dashboard">
							The <Ui>Dashboard</Ui> shows your withdrawal rate, when the money lasts to, FIRE milestones and a
							Monte-Carlo success probability — updating live.
						</Step>
					</Card>
					<Shot
						src="dashboard.png"
						alt="PlanFIRE dashboard"
						label="planfire · dashboard"
						accent={S.accent}
						caption="The Dashboard is home base: a plain-language health verdict, key numbers, spending controls, and the full projection — all recomputed the instant you change an input."
					/>
				</Cols>
				<div style={{ marginTop: 14 }}>
					<Callout icon="🧭">
						Your data saves automatically — to the server when you're signed in, or to this device as a guest. The{" "}
						<strong>Plan health</strong> badge in the sidebar always shows an at-a-glance verdict for the active plan.
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
				sub="A plan is a complete what-if scenario. Because expenses and assets are tagged by plan, one set of inputs powers many futures — and you compare them side by side instead of juggling spreadsheets."
			>
				<Cols>
					<div style={{ display: "grid", gap: 14 }}>
						<Card style={{ display: "grid", gap: 13 }}>
							<div style={{ fontSize: FS.base, color: S.textMuted, lineHeight: 1.65 }}>
								Every plan carries its own name, icon and color. For each property you own, a plan picks one action:
							</div>
							<div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
								<Badge color={S.textMuted}>• Keep</Badge>
								<Badge color={S.accent}>↑ Sell</Badge>
								<Badge color={S.blue}>↻ Rent</Badge>
							</div>
							<div style={{ fontSize: FS.base, color: S.textMuted, lineHeight: 1.65 }}>
								Plans can also add a new-home purchase with a transition delay. Switch the active plan any time from
								the <strong>plan switcher</strong> in the top bar — every chart, milestone and probability recomputes
								for that plan. Duplicate a plan and change one variable to see its impact in isolation.
							</div>
						</Card>
						<Button variant="secondary" size="sm" onClick={open("plan")} style={{ justifySelf: "start" }}>
							Open Plans →
						</Button>
					</div>
					<Shot
						src="plans.png"
						alt="Plans comparison"
						label="planfire · plans"
						accent={S.blue}
						caption="Create, duplicate and compare named scenarios. Each plan is an independent snapshot of every input."
					/>
				</Cols>
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
				<p style={{ fontSize: FS.base, color: S.textMuted, lineHeight: 1.65, margin: 0, maxWidth: 760 }}>
					Tagging is what makes one dataset serve many plans. Every expense and every asset carries an{" "}
					<strong>“Applies to which plans?”</strong> control — a row of chips with <Ui>All plans</Ui> plus one chip per
					plan. What you tag decides what each plan counts.
				</p>

				<Clip
					src="tagging.webm"
					poster="expenses.png"
					accent={S.accent}
					label="planfire · expenses — tagging"
					caption="Watch the chips toggle: with All plans off and Stay put + Rent it out selected, this expense is counted only in those two plans — the hint updates to “Only counted in the selected plan(s).”"
				/>

				<Cols>
					<div style={{ display: "grid", gap: 12 }}>
						<Eyebrow color={S.accent}>How tagging behaves</Eyebrow>
						<Step n="1" title="All plans (the default)">
							Leave an item on <Ui>All plans</Ui> and it's counted in every scenario — groceries, utilities, your core
							brokerage account.
						</Step>
						<Step n="2" title="Specific plans only">
							Tap one or more plan chips and the item is counted <em>only</em> in those plans. Picking a specific plan
							drops <Ui>All</Ui> automatically.
						</Step>
						<Step n="3" title="Mix and match">
							An item can belong to several plans at once — a boat slip that exists in <em>Stay put</em> and{" "}
							<em>Rent it out</em> but not <em>Downsize</em>.
						</Step>
					</div>
					<div style={{ display: "grid", gap: 12 }}>
						<Eyebrow color={S.accent}>Why it matters</Eyebrow>
						<div style={{ fontSize: FS.base, color: S.textMuted, lineHeight: 1.65 }}>
							Tagging turns a single expense list into a real comparison engine. A mortgage tagged only to{" "}
							<em>Stay put</em> disappears the moment you switch to <em>Sell &amp; downsize</em> — no duplicate
							scenarios, no re-entry. Rows that don't apply to the active plan grey out so you always see what's really
							counting.
						</div>
						<Callout icon="🏠" tone="warning">
							<strong>Assets tag the same way.</strong> Liquid accounts only fund the portfolio in the plans they're
							tagged to. Real estate goes further: each plan independently marks a property{" "}
							<Tag color={S.textMuted}>Keep</Tag> <Tag color={S.accent}>Sell</Tag> <Tag color={S.blue}>Rent</Tag>, with
							its own sale proceeds and rental economics.
						</Callout>
					</div>
				</Cols>

				<Cols>
					<Shot
						src="expenses.png"
						alt="Expenses tagged to plans"
						label="planfire · expenses"
						accent={S.accent}
						caption="Expenses: the “Applies to which plans?” chips and priority tiers sit right in the add form; each row shows its plan tags and tier."
					/>
					<Shot
						src="assets.png"
						alt="Assets tagged to plans"
						label="planfire · assets"
						accent={S.warning}
						caption="Assets: the same chips tag every account; real estate adds keep/sell/rent economics with an “Included in” plan row."
					/>
				</Cols>

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
				<p style={{ fontSize: FS.base, color: S.textMuted, lineHeight: 1.65, margin: 0, maxWidth: 760 }}>
					Real retirees don't spend the same in a crash as in a boom — they tighten the belt. Flex spend controls model
					that discipline so your plan isn't judged on rigid, worst-case spending it would never actually maintain.
				</p>

				<Shot
					src="flex-spend.png"
					alt="Downturn spending controls"
					label="planfire · dashboard — downturn controls"
					accent={S.warning}
					caption="The Downturn spending controls card lives on the Dashboard: choose when cuts apply, then set how deep Discretionary and Luxury spending flex — Essentials never move."
				/>

				<Cols>
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
							On the <Ui>Dashboard</Ui>, two sliders set how deep to cut <em>Discretionary</em> and <em>Luxury</em>{" "}
							spending (0–100% each). Then choose <strong>when</strong> they apply:
						</div>
						<div style={{ display: "grid", gap: 7 }}>
							<div style={{ fontSize: FS.sm, color: S.textMuted }}>
								<Ui>Downturn + recovery</Ui> — belt-tightening only during down markets and while recovering.
							</div>
							<div style={{ fontSize: FS.sm, color: S.textMuted }}>
								<Ui>All years</Ui> — a permanently leaner budget across the whole projection.
							</div>
						</div>
					</div>
				</Cols>

				<Callout icon="🎯" tone="warning">
					Flex spending is one of the most powerful levers you have. A plan that looks shaky at full spend can turn
					resilient when discretionary and luxury spending flex down in bad years — because the biggest damage from a
					crash is selling assets while they're cheap. Try modest cuts and watch your success probability move.
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
				<p style={{ fontSize: FS.base, color: S.textMuted, lineHeight: 1.65, margin: 0, maxWidth: 760 }}>
					Averages hide the thing that actually breaks retirements: the <em>order</em> returns arrive in. The Time
					Machine replays real market history — every year since 1928 — on <strong>your</strong> portfolio, so you can
					see how you'd have fared living through it.
				</p>

				<Clip
					src="time-machine.webm"
					poster="time-machine.png"
					accent={S.blue}
					label="planfire · markets — time machine"
					caption="Jump between real eras — the Great Depression, Post-War Boom, Stagflation, the Long Bull, the GFC — and every asset class's real return, growth and worst drawdown for that window updates instantly."
				/>

				<Cols>
					<div style={{ display: "grid", gap: 12 }}>
						<Eyebrow color={S.blue}>How to use it</Eyebrow>
						<Step n="1" title="Pick an era" color={S.blue}>
							Choose the <Ui>Time Machine</Ui> regime on the <Ui>Markets</Ui> page, then tap a famous window or drag
							the start/end sliders to any custom span.
						</Step>
						<Step n="2" title="Set your allocation" color={S.blue}>
							Spread across stocks, Treasury &amp; corporate bonds, real estate, gold and cash. Use a preset or hit{" "}
							<Ui>⌖ Match my assets</Ui> to mirror what you actually hold.
						</Step>
						<Step n="3" title="Read the outcome" color={S.blue}>
							Each asset class shows its real CAGR, total growth and worst drawdown for that window; your blended mix
							reports a combined return before and after inflation.
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
				</Cols>
			</Spotlight>

			{/* ── Feature walkthroughs ────────────────────────────────────────── */}
			<Section
				id="walkthroughs"
				refs={refs}
				icon="🧩"
				title="Feature walkthroughs"
				accent={S.purple}
				sub="A hands-on tour of every screen, with the real interface and step-by-step instructions. Each card jumps you straight there."
			>
				<div style={{ display: "grid", gap: 16 }}>
					<Walkthrough
						refs={refs}
						id="wt-dashboard"
						icon="📊"
						title="Dashboard"
						color={S.accent}
						shot="dashboard.png"
						shotLabel="planfire · dashboard"
						onOpen={open("dashboard")}
						shotCaption="Health banner, key numbers, spending controls, and the full projection with milestones and odds."
						intro="Your command center. Everything here reflects the active plan and recomputes the moment you change an input anywhere in the app."
						steps={[
							{ title: "Read the health banner", body: "Top of the page: a plain-language verdict (Healthy / At risk), whether the money lasts, and how the plan survives a Lost-Decade stress test." },
							{ title: "Scan the stat cards", body: "Portfolio, spending at key ages (Medicare, Social Security), your withdrawal rate vs the 4% guideline, and the projected balance at 90." },
							{ title: "Dial the controls", body: "Zoom the age range, flip between Nominal $ and Today's $, and set the Downturn spending cuts (see Flex spend controls above)." },
							{ title: "Study the results", body: "The portfolio projection under two market regimes, income vs spending, FIRE milestones, and the Monte-Carlo success probability." },
						]}
					/>
					<Walkthrough
						refs={refs}
						id="wt-income"
						icon="💰"
						title="Income"
						color={S.blue}
						shot="income.png"
						shotLabel="planfire · income"
						onOpen={open("income")}
						shotCaption="Salary, Social Security, pensions and other streams — each tagged by plan with its own age window."
						intro="Model every income stream and exactly when it starts and stops, so the projection matches real life."
						steps={[
							{ title: "Add a stream", body: "Pick a type (Salary, Bonus, RSU/Equity, Other), name it, and enter the amount. Tag it to the plans it belongs to." },
							{ title: "Bound it by age", body: "Use the advanced options to set start/stop ages — e.g. consulting income that ends at 55, or a pension that begins at 65." },
							{ title: "Handle equity", body: "RSUs can be a steady annual figure or an explicit multi-year vesting schedule that the engine spreads across the right ages." },
						]}
					/>
					<Walkthrough
						refs={refs}
						id="wt-expenses"
						icon="🧾"
						title="Expenses"
						color={S.accent}
						shot="expenses.png"
						shotLabel="planfire · expenses"
						onOpen={open("expenses")}
						shotCaption="Add form with plan tags + priority tiers up top; categorized rows below, each showing its tags and tier."
						intro="Your monthly spending, organized so it can flex and vary across plans and ages."
						steps={[
							{ title: "Add an expense", body: "Choose a category, name it, and enter a monthly amount. Hit Add — the form keeps your category and tags so similar rows are quick." },
							{ title: "Tag & tier it", body: "Set which plans it applies to and how essential it is (Essential / Discretionary / Luxury) — the tier drives the flex-spend cuts." },
							{ title: "Refine with advanced", body: "Optionally limit an expense to an age range (e.g. travel until 80) or override its inflation (use 0% for a fixed mortgage)." },
							{ title: "Manage categories", body: "The Categories button lets you add your own categories with custom icons and colors." },
						]}
					/>
					<Walkthrough
						refs={refs}
						id="wt-assets"
						icon="🏦"
						title="Assets"
						color={S.warning}
						shot="assets.png"
						shotLabel="planfire · assets"
						onOpen={open("assets")}
						shotCaption="Everything you own, grouped by type and tagged by plan; real estate carries its own sale/rental economics."
						intro="One unified pool of what you own. Liquid accounts grow with the market; real estate is handled per plan."
						steps={[
							{ title: "Add an account", body: "Pick a type — Cash, Brokerage, Retirement, Real estate or Other — name it, and enter a balance. Tag it to the relevant plans." },
							{ title: "Detail your property", body: "For real estate, add market value, mortgage owed, and (if you'd rent it) monthly rent and annual costs. The card shows net-if-sold and net-if-rented." },
							{ title: "Set keep/sell/rent", body: "Whether a property is kept, sold or rented is chosen per plan over on the Plans page — the Assets page shows which plans include it." },
						]}
					/>
					<Walkthrough
						refs={refs}
						id="wt-markets"
						icon="📈"
						title="Markets"
						color={S.blue}
						shot="time-machine.png"
						shotLabel="planfire · markets"
						onOpen={open("markets")}
						shotCaption="Three market regimes to choose from, plus the long-run return and inflation that drive every plan."
						intro="Decide how markets behave across your projection — from a simple average to a full historical replay."
						steps={[
							{ title: "Choose a regime", body: "Historical average (a steady return), Lost decade (a sequence-risk stress test), or the Time Machine (replay a real era — see the spotlight above)." },
							{ title: "Set return & inflation", body: "Dial the long-run nominal return and the inflation that erodes it; the page shows the resulting real return live." },
							{ title: "See the impact", body: "Every plan and projection in the app uses these assumptions, so changes here ripple straight to the Dashboard." },
						]}
					/>
					<Walkthrough
						refs={refs}
						id="wt-plans"
						icon="🗺️"
						title="Plans"
						color={S.blue}
						shot="plans.png"
						shotLabel="planfire · plans"
						onOpen={open("plan")}
						shotCaption="Create and compare named strategies; set each property's fate and any new-home purchase per plan."
						intro="Where scenarios are born. Build as many as you like and compare them without re-entering a thing."
						steps={[
							{ title: "Create or duplicate", body: "Start a fresh plan or duplicate an existing one and tweak a single variable to isolate its effect." },
							{ title: "Decide each property", body: "Per plan, mark every property Keep, Sell or Rent, and optionally add a new-home purchase with a transition delay." },
							{ title: "Compare head to head", body: "Switch the active plan from the top bar and read the comparison — the whole app re-projects instantly for that plan." },
						]}
					/>
					<Walkthrough
						refs={refs}
						id="wt-copilot"
						icon="✦"
						title="AI Co-pilot"
						color={S.purple}
						shot="copilot.png"
						shotLabel="planfire · co-pilot"
						onOpen={open("copilot")}
						shotCaption="A chat assistant grounded in your real numbers that can propose one-tap changes to your plan."
						intro="Ask questions in plain English and get answers grounded in a numeric snapshot of your actual plan."
						steps={[
							{ title: "Ask anything", body: "“Can I retire at 57?”, “What if inflation runs hot?” — the Co-pilot answers with your real figures, not generic advice." },
							{ title: "Apply suggestions", body: "It can propose concrete changes (e.g. shift the retirement age) that you apply to your plan with one tap." },
							{ title: "Works offline too", body: "Without an API key it falls back to a deterministic offline reply, so the feature never hard-fails." },
						]}
					/>
				</div>

				<div style={{ marginTop: 16 }}>
					<Card style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
						<span style={{ fontSize: 22 }}>⚙️</span>
						<div style={{ flex: 1, minWidth: 220 }}>
							<div style={{ fontSize: FS.md, fontWeight: FW.semibold, color: S.text }}>Settings &amp; your data</div>
							<div style={{ fontSize: FS.base, color: S.textMuted, lineHeight: 1.6, marginTop: 3 }}>
								Tabbed Settings cover Profile, Account, Notifications, Privacy &amp; Data, Appearance (light / dark /
								system) and experimental Labs flags. Under <Ui>Privacy &amp; Data</Ui> you can export a full JSON
								backup, import one, or reset everything.
							</div>
						</div>
						<Button variant="secondary" size="sm" onClick={open("settings")}>
							Open Settings →
						</Button>
					</Card>
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
						the withdrawal by trimming or age-gating luxury expenses, and check your Markets return isn't
						unrealistically low. The Co-pilot can suggest and apply these for you.
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
