import { useTheme } from "../theme/ThemeProvider.jsx";
import { usePlanner } from "../state/PlannerProvider.jsx";
import { fmt, LOST_DECADE } from "../engine.js";
import { SectionTitle, Card, CardHeader, StatCard } from "../components/ui.jsx";
import SliderRow from "../components/SliderRow.jsx";
import TimeMachine from "../components/settings/TimeMachine.jsx";

// The three return regimes the projection can run under. `colorKey` indexes the
// theme palette so each card carries its own accent.
const REGIMES = [
	{
		id: "historical",
		icon: "📈",
		title: "Historical average",
		desc: "A steady long-run return applied evenly to every year — the simplest baseline.",
		colorKey: "accent",
	},
	{
		id: "lost_decade",
		icon: "📉",
		title: "Lost decade",
		desc: "A flat, choppy stretch of poor returns before they normalize. A stress test for sequence risk.",
		colorKey: "danger",
	},
	{
		id: "historical_period",
		icon: "🕰",
		title: "Time Machine",
		desc: "Replay any real market era across stocks, bonds, gold, real estate & cash — on your portfolio.",
		colorKey: "blue",
	},
];

/* ── Regime choice card ────────────────────────────────────────────────── */
function RegimeCard({ S, regime, color, active, onClick }) {
	return (
		<button
			className="lift"
			onClick={onClick}
			style={{
				textAlign: "left",
				cursor: "pointer",
				padding: 16,
				borderRadius: 14,
				border: `1.5px solid ${active ? color : S.border}`,
				background: active ? color + "12" : S.card,
				boxShadow: active ? `0 0 0 1px ${color}33, ${S.shadowSm}` : S.shadowSm,
				display: "flex",
				flexDirection: "column",
				gap: 9,
			}}
		>
			<div style={{ display: "flex", alignItems: "center", gap: 10 }}>
				<span
					style={{
						fontSize: 17,
						width: 34,
						height: 34,
						borderRadius: 9,
						display: "inline-flex",
						alignItems: "center",
						justifyContent: "center",
						background: color + "1e",
						flexShrink: 0,
					}}
				>
					{regime.icon}
				</span>
				<span style={{ fontSize: 14, fontWeight: 700, color: active ? color : S.text }}>
					{regime.title}
				</span>
				<span style={{ flex: 1 }} />
				{active && <span style={{ fontSize: 14, color, lineHeight: 1 }}>●</span>}
			</div>
			<div style={{ fontSize: 12, color: S.textMuted, lineHeight: 1.55 }}>{regime.desc}</div>
		</button>
	);
}

/* ── Return-sequence preview bars ──────────────────────────────────────── */
function ReturnsBars({ S, bars }) {
	return (
		<div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 84 }}>
			{bars.map((y, i) => {
				const r = y.r;
				const h = Math.max(5, Math.min(74, Math.abs(r) * 280));
				return (
					<div
						key={i}
						style={{
							flex: 1,
							display: "flex",
							flexDirection: "column",
							alignItems: "center",
							justifyContent: "flex-end",
							height: "100%",
						}}
					>
						<div
							style={{
								width: "100%",
								maxWidth: 38,
								height: h,
								borderRadius: 4,
								background: r < 0 ? S.danger : S.accent,
								opacity: y.tail ? 0.45 : 1,
							}}
						/>
						<span style={{ fontSize: 9, color: r < 0 ? S.danger : S.textMuted, marginTop: 5, fontFamily: S.mono }}>
							{(r * 100).toFixed(0)}
						</span>
					</div>
				);
			})}
		</div>
	);
}

/* ── Page ──────────────────────────────────────────────────────────────── */
export default function MarketView() {
	const S = useTheme();
	const {
		marketMode, setMarketMode,
		nomReturn, setNomReturn,
		inflation, setInflation,
		realRet,
		projections,
	} = usePlanner();

	const isPeriod = marketMode === "historical_period";

	// Year-by-year preview for the non-replay regimes: lost-decade plays its real
	// sequence then tails off at the steady rate; historical is flat.
	const previewBars =
		marketMode === "lost_decade"
			? [...LOST_DECADE.map((r) => ({ r })), { r: nomReturn, tail: true }]
			: Array(11).fill({ r: nomReturn });

	return (
		<div className="fade-in" style={{ display: "grid", gap: 16 }}>
			<SectionTitle sub="Choose how markets behave across your projection, then dial in the long-run return and inflation that drive every plan.">
				Markets
			</SectionTitle>

			{/* Regime chooser */}
			<div className="col-3">
				{REGIMES.map((r) => (
					<RegimeCard
						key={r.id}
						S={S}
						regime={r}
						color={S[r.colorKey]}
						active={marketMode === r.id}
						onClick={() => setMarketMode(r.id)}
					/>
				))}
			</div>

			{/* Mode-specific body */}
			{isPeriod ? (
				<Card>
					<CardHeader
						icon="🕰"
						title="Time Machine"
						subtitle="Pick an era, set your allocation, and see how your portfolio would have fared through real market history."
					/>
					<TimeMachine />
				</Card>
			) : (
				<Card>
					<CardHeader
						icon={marketMode === "lost_decade" ? "📉" : "📈"}
						title={marketMode === "lost_decade" ? "Lost-decade return sequence" : "Steady return sequence"}
						subtitle={
							marketMode === "lost_decade"
								? "A poor first decade — negative and flat years — before returns settle at your long-run average (faded)."
								: "Your long-run average return, applied evenly to every year of the projection."
						}
					/>
					<ReturnsBars S={S} bars={previewBars} />
				</Card>
			)}

			{/* Return & inflation inputs */}
			<Card>
				<CardHeader
					icon="🎛️"
					title="Return & inflation"
					subtitle={
						isPeriod
							? "The steady return applies after the replayed era ends. Inflation stays constant throughout."
							: "Set the long-run nominal return and the inflation that erodes it."
					}
				/>
				<div className="col-2">
					<SliderRow
						label={isPeriod ? "Steady return (after the era)" : "Nominal return"}
						value={nomReturn}
						onChange={setNomReturn}
						min={0}
						max={0.15}
						step={0.0025}
						editScale={100}
						editMax={0.5}
						format={(v) => `${(v * 100).toFixed(2)}%`}
					/>
					<SliderRow
						label="Inflation"
						value={inflation}
						onChange={setInflation}
						min={0}
						max={0.1}
						step={0.0025}
						editScale={100}
						editMax={0.3}
						format={(v) => `${(v * 100).toFixed(2)}%`}
					/>
				</div>
			</Card>

			{/* Resulting numbers */}
			<div className="stat-grid">
				<StatCard
					label="Real return"
					value={`${(realRet * 100).toFixed(1)}%`}
					sub="After inflation"
					accent={realRet >= 0 ? S.accent : S.danger}
					color={realRet >= 0 ? S.accent : S.danger}
				/>
				<StatCard label="Nominal return" value={`${(nomReturn * 100).toFixed(1)}%`} sub="Before inflation" />
				<StatCard label="Inflation" value={`${(inflation * 100).toFixed(1)}%`} sub="Annual" />
				<StatCard
					label="Real growth / yr"
					value={`${fmt(Math.round(projections.startPort * realRet))}`}
					sub={`On ${fmt(projections.startPort)} today`}
					accent={S.blue}
					color={S.blue}
				/>
			</div>
		</div>
	);
}
