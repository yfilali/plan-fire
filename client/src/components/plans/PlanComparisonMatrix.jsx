// PlanComparisonMatrix — the centerpiece side-by-side comparison table.
//
// One COLUMN per plan, one ROW per metric. The best cell in each row gets a
// subtle accent wash + a "best" marker, and a "Recommended" callout names the
// strongest plan with a one-line rationale. Purely presentational: it renders
// the outcomes handed to it and calls onSelect — no data fetching, no mutation.

import { useTheme } from "../../theme/ThemeProvider.jsx";
import { Card, CardHeader, Badge } from "../ui.jsx";
import Icon from "../Icon.jsx";
import { fmt } from "../../engine.js";
import { planColor } from "../../lib/planMeta.js";
import { computePlanHealth, healthVisual } from "../../lib/planHealth.js";

// Resolve an outcome's tone palette key to a real color (outcomes carry `tone`
// rather than a full plan object, so build a plan-ish shim for planColor).
const colorFor = (S, o) => planColor(S, { tone: o.tone });

// Health verdict for a plan, folding in Monte Carlo success when we have it.
function healthFor(o, mcByPlan) {
	if (!mcByPlan) return o.health;
	return computePlanHealth({
		runsOut: o.runsOutAge != null ? { age: o.runsOutAge } : null,
		effWR: o.effWR,
		mcSuccess: mcByPlan[o.planId]?.successRate,
		planIsEmpty: o.isEmpty,
	});
}

export default function PlanComparisonMatrix({ outcomes, mcByPlan, activePlanId, onSelect }) {
	const S = useTheme();
	const list = (outcomes || []).filter(Boolean);

	if (list.length === 0) {
		return (
			<Card>
				<CardHeader title="Compare plans" icon="⚖️" />
				<div style={{ fontSize: 13, color: S.textMuted }}>No plans to compare yet.</div>
			</Card>
		);
	}

	const multi = list.length > 1;
	const showMC = !!mcByPlan;

	// ── Row definitions ──────────────────────────────────────────────────
	// each: { key, label, cell(o), metric(o)->number|null, dir:'max'|'min' }
	// metric returns the comparable number used to find the best cell; dir says
	// whether higher or lower wins. metric===null means the row isn't ranked.
	const rows = [
		{
			key: "retire",
			label: "Retirement age",
			cell: (o) => <span style={{ fontFamily: S.mono }}>{o.retireAge}</span>,
			// An assumption this plan makes, not an outcome — never ranked.
			metric: null,
		},
		{
			key: "ss",
			label: "Social Security",
			cell: (o) => (
				<span style={{ fontFamily: S.mono }}>
					{fmt(o.ssAnnual || 0)}/yr @ {o.ssAge}
				</span>
			),
			metric: null,
		},
		{
			key: "cuts",
			label: "Downturn cuts",
			cell: (o) => (
				<span style={{ fontFamily: S.mono }}>
					{Math.round((o.discretionaryCut || 0) * 100)}% / {Math.round((o.luxuryCut || 0) * 100)}%
				</span>
			),
			metric: null,
		},
		{
			key: "health",
			label: "Health",
			cell: (o) => {
				const h = healthFor(o, mcByPlan);
				const v = healthVisual(h.status, S);
				return (
					<span style={{ display: "inline-flex", alignItems: "center", gap: 6, color: v.color, fontWeight: 650 }}>
						<Icon name={v.icon} size={15} color={v.color} />
						{v.label}
					</span>
				);
			},
			metric: null,
		},
		{
			key: "longevity",
			label: "Money lasts",
			cell: (o) =>
				o.runsOutAge != null ? (
					<span style={{ color: S.danger, fontWeight: 600 }}>Runs out at {o.runsOutAge}</span>
				) : (
					<span style={{ color: S.text }}>Lasts to {o.endAge}</span>
				),
			// Higher is better; "never runs out" ranks above any depletion age.
			metric: (o) => (o.runsOutAge != null ? o.runsOutAge : Infinity),
			dir: "max",
		},
		{
			key: "ending",
			label: "Ending balance",
			cell: (o) => <span style={{ fontFamily: S.mono, fontWeight: 650 }}>{fmt(o.endingBalanceNominal)}</span>,
			metric: (o) => o.endingBalanceNominal,
			dir: "max",
		},
		{
			key: "wr",
			label: "Effective withdrawal rate",
			cell: (o) => <span style={{ fontFamily: S.mono }}>{o.effWR.toFixed(1)}%</span>,
			metric: (o) => o.effWR,
			dir: "min",
		},
		{
			key: "net",
			label: "Net to portfolio",
			cell: (o) => {
				const n = o.econ?.netToPortfolio ?? 0;
				const c = n > 0 ? S.accent : n < 0 ? S.danger : S.textMuted;
				return (
					<span style={{ fontFamily: S.mono, fontWeight: 600, color: c }}>
						{n > 0 ? "+" : ""}
						{fmt(n)}
					</span>
				);
			},
			metric: (o) => o.econ?.netToPortfolio ?? 0,
			dir: "max",
		},
		{
			key: "spend",
			label: "Annual spending",
			cell: (o) => <span style={{ fontFamily: S.mono }}>{fmt(o.annualSpendAtRetire)}</span>,
			metric: null,
		},
		showMC && {
			key: "mc",
			label: "Monte Carlo success",
			cell: (o) => {
				const sr = mcByPlan[o.planId]?.successRate;
				if (sr == null) return <span style={{ color: S.textDim }}>—</span>;
				return <span style={{ fontFamily: S.mono, fontWeight: 650 }}>{Math.round(sr * 100)}%</span>;
			},
			metric: (o) => (mcByPlan[o.planId]?.successRate ?? null),
			dir: "max",
		},
	].filter(Boolean);

	// ── Best cell per row ────────────────────────────────────────────────
	// Returns the set of planIds that hold the winning value. Only ranks when
	// there are 2+ plans and the values actually differ (a tie across all plans
	// teaches nothing, so it stays unmarked).
	const bestSet = (row) => {
		if (!multi || row.metric == null) return null;
		const vals = list.map((o) => ({ id: o.planId, v: row.metric(o) }));
		// Infinity (never runs out) is intentionally comparable; null/NaN are not.
		const comparable = vals.filter((x) => x.v != null && (Number.isFinite(x.v) || x.v === Infinity));
		if (comparable.length === 0) return null;
		const best = comparable.reduce(
			(acc, x) => (row.dir === "min" ? Math.min(acc, x.v) : Math.max(acc, x.v)),
			row.dir === "min" ? Infinity : -Infinity,
		);
		const winners = comparable.filter((x) => x.v === best).map((x) => x.id);
		// If everyone shares the same value, nothing is "best".
		if (winners.length === comparable.length) return null;
		return new Set(winners);
	};

	// ── Recommended plan ─────────────────────────────────────────────────
	const recommended = (() => {
		if (list.length < 2) return null;
		const survivors = list.filter((o) => o.runsOutAge == null);
		const pool = survivors.length ? survivors : list;
		const sorted = [...pool].sort((a, b) => {
			if (survivors.length) {
				// among survivors: highest ending balance, tie-break lower WR
				if (b.endingBalanceNominal !== a.endingBalanceNominal)
					return b.endingBalanceNominal - a.endingBalanceNominal;
				return a.effWR - b.effWR;
			}
			// all run out: latest depletion age wins, tie-break lower WR
			if ((b.runsOutAge ?? 0) !== (a.runsOutAge ?? 0)) return (b.runsOutAge ?? 0) - (a.runsOutAge ?? 0);
			return a.effWR - b.effWR;
		});
		const top = sorted[0];
		const why = survivors.length
			? `Money lasts the full plan and it leaves the most behind — ${fmt(top.endingBalanceNominal)} at age ${top.endAge}.`
			: `Every plan eventually runs dry, but this one stretches furthest — to age ${top.runsOutAge}.`;
		return { o: top, why };
	})();

	const colTemplate = `minmax(150px, 1.3fr) repeat(${list.length}, minmax(130px, 1fr))`;
	const cellPad = "11px 14px";

	return (
		<Card>
			<CardHeader
				title="Compare plans"
				icon="⚖️"
				subtitle={multi ? "Best value in each row is highlighted." : "Add another plan to see a side-by-side comparison."}
			/>

			{recommended && (
				<div
					style={{
						display: "flex",
						alignItems: "center",
						gap: 12,
						padding: "12px 14px",
						marginBottom: 14,
						borderRadius: 12,
						border: `1px solid ${colorFor(S, recommended.o)}55`,
						background: `linear-gradient(160deg, ${colorFor(S, recommended.o)}1c, ${colorFor(S, recommended.o)}08)`,
					}}
				>
					<span style={{ fontSize: 22 }}>{recommended.o.icon}</span>
					<div style={{ flex: 1, minWidth: 0 }}>
						<div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
							<Badge color={colorFor(S, recommended.o)}>Recommended</Badge>
							<span style={{ fontSize: 14, fontWeight: 700, color: colorFor(S, recommended.o) }}>{recommended.o.name}</span>
						</div>
						<div style={{ fontSize: 12, color: S.textMuted, marginTop: 4, lineHeight: 1.45 }}>{recommended.why}</div>
					</div>
				</div>
			)}

			{/* Horizontal scroll when many plans don't fit. */}
			<div style={{ overflowX: "auto", margin: "0 -2px" }}>
				<div style={{ minWidth: 360, display: "grid", gridTemplateColumns: colTemplate }}>
					{/* Header row */}
					<div
						style={{
							padding: cellPad,
							fontSize: 10.5,
							fontWeight: 600,
							textTransform: "uppercase",
							letterSpacing: 0.6,
							color: S.textDim,
							borderBottom: `1px solid ${S.borderStrong}`,
						}}
					>
						Metric
					</div>
					{list.map((o) => {
						const c = colorFor(S, o);
						const isActive = o.planId === activePlanId;
						return (
							<button
								key={o.planId}
								type="button"
								onClick={() => onSelect?.(o.planId)}
								title={`Switch to ${o.name}`}
								style={{
									appearance: "none",
									cursor: "pointer",
									textAlign: "left",
									padding: cellPad,
									border: "none",
									borderBottom: `2px solid ${isActive ? c : S.borderStrong}`,
									borderRadius: "10px 10px 0 0",
									background: isActive ? `${c}16` : "transparent",
									display: "flex",
									alignItems: "center",
									gap: 8,
									minWidth: 0,
								}}
							>
								<span style={{ fontSize: 18 }}>{o.icon}</span>
								<span style={{ minWidth: 0 }}>
									<span
										style={{
											display: "block",
											fontSize: 13,
											fontWeight: 700,
											color: c,
											overflow: "hidden",
											textOverflow: "ellipsis",
											whiteSpace: "nowrap",
										}}
									>
										{o.name}
									</span>
									{(o.baseline || isActive) && (
										<span style={{ fontSize: 10, color: S.textDim, fontWeight: 600 }}>
											{o.baseline ? "Baseline" : ""}
											{o.baseline && isActive ? " · " : ""}
											{isActive ? "Active" : ""}
										</span>
									)}
								</span>
							</button>
						);
					})}

					{/* Metric rows */}
					{rows.map((row, ri) => {
						const best = bestSet(row);
						const lastRow = ri === rows.length - 1;
						return (
							<div key={row.key} style={{ display: "contents" }}>
								<div
									style={{
										padding: cellPad,
										fontSize: 12,
										fontWeight: 550,
										color: S.textMuted,
										borderBottom: lastRow ? "none" : `1px solid ${S.border}`,
										display: "flex",
										alignItems: "center",
									}}
								>
									{row.label}
								</div>
								{list.map((o) => {
									const isBest = best?.has(o.planId);
									const isActive = o.planId === activePlanId;
									return (
										<div
											key={o.planId}
											style={{
												padding: cellPad,
												fontSize: 13,
												color: S.text,
												borderBottom: lastRow ? "none" : `1px solid ${S.border}`,
												background: isBest ? `${S.accent}14` : isActive ? `${colorFor(S, o)}0a` : "transparent",
												display: "flex",
												alignItems: "center",
												justifyContent: "space-between",
												gap: 8,
												minWidth: 0,
											}}
										>
											<span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
												{row.cell(o)}
											</span>
											{isBest && (
												<span
													style={{
														flexShrink: 0,
														fontSize: 9.5,
														fontWeight: 700,
														textTransform: "uppercase",
														letterSpacing: 0.5,
														color: S.accent,
														display: "inline-flex",
														alignItems: "center",
														gap: 3,
													}}
												>
													<Icon name="check" size={11} color={S.accent} />
													best
												</span>
											)}
										</div>
									);
								})}
							</div>
						);
					})}
				</div>
			</div>
		</Card>
	);
}
