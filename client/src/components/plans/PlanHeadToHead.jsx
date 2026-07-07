import { useState, useMemo } from "react";
import { useTheme } from "../../theme/ThemeProvider.jsx";
import { Card, CardHeader, Select } from "../ui.jsx";
import { fmt } from "../../engine.js";

// PlanHeadToHead — pick two plans and read a focused A-vs-B delta table.
// Presentational only: it consumes precomputed outcomes (computePlanOutcome[])
// and never fetches or mutates anything.

const toneColor = (S, o) => (o && S[o.tone]) || S.accent;

// "+$1.2M" / "−$340K" — signed compact money.
const signedMoney = (n) => (n >= 0 ? "+" : "−") + fmt(Math.abs(n));

export default function PlanHeadToHead({ outcomes, plans }) {
	const S = useTheme();

	// Only well-formed outcomes can be compared (guard the loading window).
	const valid = (outcomes || []).filter((o) => o && o.planId != null);

	// Default A = baseline (else first); B = the next distinct plan.
	const defA = valid.find((o) => o.baseline) || valid[0];
	const defB = valid.find((o) => o !== defA);

	const [aId, setAId] = useState(defA?.planId);
	const [bId, setBId] = useState(defB?.planId);

	const a = valid.find((o) => o.planId === aId) || defA;
	const b = valid.find((o) => o.planId === bId) || defB;

	const rows = useMemo(() => buildRows(S, a, b), [S, a, b]);

	if (valid.length < 2) {
		return (
			<Card>
				<CardHeader title="Head to head" icon="⚔️" />
				<div style={{ fontSize: 12.5, color: S.textMuted, lineHeight: 1.5 }}>
					Add another plan to compare two side by side.
				</div>
			</Card>
		);
	}

	const cA = toneColor(S, a);
	const cB = toneColor(S, b);

	// Headline: who leaves more at the end of the horizon.
	const endDelta = (a?.endingBalanceNominal || 0) - (b?.endingBalanceNominal || 0);
	const headColor = endDelta === 0 ? S.textMuted : endDelta > 0 ? S.accent : S.danger;
	const headText =
		endDelta === 0
			? `${a.name} and ${b.name} end with the same balance`
			: `${endDelta > 0 ? a.name : b.name} leaves ${fmt(Math.abs(endDelta))} more at age ${a.endAge}`;

	return (
		<Card>
			<CardHeader
				title="Head to head"
				icon="⚔️"
				subtitle="Pick two plans for a focused side-by-side delta."
			/>

			{/* Pickers */}
			<div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 14 }}>
				<Picker label="Plan A" color={cA} value={aId} onChange={setAId} options={valid} S={S} />
				<Picker label="Plan B" color={cB} value={bId} onChange={setBId} options={valid} S={S} />
			</div>

			{/* Headline */}
			<div
				style={{
					padding: "11px 13px",
					borderRadius: 12,
					background: headColor + "12",
					border: `1px solid ${headColor}33`,
					fontSize: 13,
					fontWeight: 600,
					color: headColor,
					marginBottom: 14,
				}}
			>
				{headText}
			</div>

			{/* Delta table */}
			<div style={{ overflowX: "auto" }}>
				<div style={{ minWidth: 380 }}>
					{/* Column header */}
					<Row
						head
						S={S}
						cells={[
							<span style={{ color: S.textDim }}>Metric</span>,
							<PlanHead o={a} color={cA} />,
							<PlanHead o={b} color={cB} />,
							<span style={{ color: S.textDim }}>A − B</span>,
						]}
					/>
					{rows.map((r, i) => (
						<Row
							key={i}
							S={S}
							zebra={i % 2 === 1}
							cells={[
								<span style={{ color: S.textMuted, fontWeight: 550 }}>{r.label}</span>,
								<span style={{ fontFamily: S.mono, color: S.text }}>{r.aVal}</span>,
								<span style={{ fontFamily: S.mono, color: S.text }}>{r.bVal}</span>,
								<span style={{ fontFamily: S.mono, fontWeight: 650, color: r.deltaColor }}>
									{r.deltaText}
								</span>,
							]}
						/>
					))}
				</div>
			</div>
		</Card>
	);
}

/* ── building the delta rows ─────────────────────────────────────────── */

function buildRows(S, a, b) {
	if (!a || !b) return [];
	const better = (n, higherBetter) =>
		n === 0 ? S.textMuted : (n > 0) === higherBetter ? S.accent : S.danger;

	// Ending balance — higher is better.
	const endD = (a.endingBalanceNominal || 0) - (b.endingBalanceNominal || 0);

	// Upfront net to portfolio (sale proceeds − new-home cost) — higher better.
	const netD = (a.econ?.netToPortfolio || 0) - (b.econ?.netToPortfolio || 0);

	// Effective withdrawal rate — lower is better.
	const wrD = (a.effWR || 0) - (b.effWR || 0);

	// Annual spending at retirement — neutral (lifestyle vs. burn-rate trade-off).
	const spendD = (a.annualSpendAtRetire || 0) - (b.annualSpendAtRetire || 0);

	// Retirement age / SS — assumptions each plan makes, not outcomes, so the
	// delta is informational only (neutral color, no "better" judgment).
	const retD = (a.retireAge || 0) - (b.retireAge || 0);
	const ssD = (a.ssAnnual || 0) - (b.ssAnnual || 0);

	return [
		{
			label: "Retirement age",
			aVal: `${a.retireAge}`,
			bVal: `${b.retireAge}`,
			deltaText: retD === 0 ? "same" : (retD > 0 ? "+" : "−") + Math.abs(retD) + "y",
			deltaColor: S.textMuted,
		},
		{
			label: "Social Security",
			aVal: `${fmt(a.ssAnnual || 0)} @ ${a.ssAge}`,
			bVal: `${fmt(b.ssAnnual || 0)} @ ${b.ssAge}`,
			deltaText: ssD === 0 ? "same" : signedMoney(ssD),
			deltaColor: S.textMuted,
		},
		{
			label: "Ending balance",
			aVal: fmt(a.endingBalanceNominal || 0),
			bVal: fmt(b.endingBalanceNominal || 0),
			deltaText: endD === 0 ? "even" : signedMoney(endD),
			deltaColor: better(endD, true),
		},
		longevityRow(S, a, b),
		{
			label: "Upfront net to portfolio",
			aVal: signedMoney(a.econ?.netToPortfolio || 0),
			bVal: signedMoney(b.econ?.netToPortfolio || 0),
			deltaText: netD === 0 ? "even" : signedMoney(netD),
			deltaColor: better(netD, true),
		},
		{
			label: "Effective withdrawal rate",
			aVal: (a.effWR || 0).toFixed(1) + "%",
			bVal: (b.effWR || 0).toFixed(1) + "%",
			deltaText: wrD === 0 ? "even" : (wrD > 0 ? "+" : "−") + Math.abs(wrD).toFixed(1) + " pp",
			deltaColor: better(wrD, false),
		},
		{
			label: "Annual spending at retire",
			aVal: fmt(a.annualSpendAtRetire || 0),
			bVal: fmt(b.annualSpendAtRetire || 0),
			deltaText: spendD === 0 ? "even" : signedMoney(spendD),
			deltaColor: S.textMuted,
		},
	];
}

// Longevity is categorical (lasts vs. runs out), so it gets its own row logic.
function longevityRow(S, a, b) {
	const aOut = a.runsOutAge;
	const bOut = b.runsOutAge;
	const aVal = aOut != null ? `Runs out ${aOut}` : `Lasts to ${a.endAge}`;
	const bVal = bOut != null ? `Runs out ${bOut}` : `Lasts to ${b.endAge}`;

	let deltaText;
	let deltaColor;
	if (aOut == null && bOut == null) {
		deltaText = "both last";
		deltaColor = S.accent;
	} else if (aOut == null) {
		deltaText = "A lasts";
		deltaColor = S.accent;
	} else if (bOut == null) {
		deltaText = "B lasts";
		deltaColor = S.danger;
	} else {
		const d = aOut - bOut; // later depletion is better
		deltaText = (d > 0 ? "+" : "−") + Math.abs(d) + "y";
		deltaColor = d === 0 ? S.textMuted : d > 0 ? S.accent : S.danger;
	}
	return { label: "Money lasts to", aVal, bVal, deltaText, deltaColor };
}

/* ── small presentational pieces ─────────────────────────────────────── */

function Picker({ label, color, value, onChange, options, S }) {
	return (
		<label style={{ flex: "1 1 150px", minWidth: 140 }}>
			<div
				style={{
					fontSize: 10.5,
					fontWeight: 700,
					letterSpacing: 0.5,
					textTransform: "uppercase",
					color,
					marginBottom: 5,
				}}
			>
				{label}
			</div>
			<Select
				value={value}
				onChange={(e) => onChange(e.target.value)}
				style={{ borderColor: color + "66" }}
			>
				{options.map((o) => (
					<option key={o.planId} value={o.planId}>
						{o.icon ? o.icon + " " : ""}
						{o.name}
					</option>
				))}
			</Select>
		</label>
	);
}

function PlanHead({ o, color }) {
	return (
		<span style={{ display: "inline-flex", alignItems: "center", gap: 5, color, fontWeight: 700 }}>
			{o?.icon && <span style={{ fontSize: 13 }}>{o.icon}</span>}
			<span
				style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 110 }}
			>
				{o?.name}
			</span>
		</span>
	);
}

function Row({ cells, S, head, zebra }) {
	return (
		<div
			style={{
				display: "grid",
				gridTemplateColumns: "minmax(140px,1.5fr) 1fr 1fr 0.9fr",
				gap: 8,
				alignItems: "center",
				padding: "9px 10px",
				borderRadius: 9,
				fontSize: 12.5,
				background: zebra ? S.bg : "transparent",
				borderBottom: head ? `1px solid ${S.border}` : "none",
				marginBottom: head ? 4 : 0,
			}}
		>
			{cells.map((c, i) => (
				<div
					key={i}
					style={{
						textAlign: i === 0 ? "left" : "right",
						fontWeight: head ? 700 : 400,
						fontSize: head ? 11 : 12.5,
						minWidth: 0,
						display: "flex",
						justifyContent: i === 0 ? "flex-start" : "flex-end",
					}}
				>
					{c}
				</div>
			))}
		</div>
	);
}
