import { useState, useMemo } from "react";
import {
	Line,
	XAxis,
	YAxis,
	Tooltip,
	Legend,
	ResponsiveContainer,
	ReferenceLine,
	CartesianGrid,
	ComposedChart,
	BarChart,
	Bar,
	Cell,
	Area,
} from "recharts";
import { useTheme } from "../theme/ThemeProvider.jsx";
import { usePlanner } from "../state/PlannerProvider.jsx";
import { fmt, deflate } from "../engine.js";
import { statusTone, wrColor } from "../lib/status.js";
import { Card, CardHeader, StatCard, Segmented, ChartTip } from "../components/ui.jsx";
import { AgeRangeSlider } from "../AgeRangeSlider.jsx";
import DownturnCutControls from "../components/DownturnCutControls.jsx";

export default function DashboardView() {
	const S = useTheme();
	const p = usePlanner();
	const {
		age,
		retireAge,
		ssAge,
		ssAnnual,
		inflation,
		nomReturn,
		marketMode,
		activePlan,
		activeEcon,
		endAge,
		realDollars,
		setRealDollars,
		projections,
		runsOut,
		altRunsOut,
		getD,
		effWR,
		spendNow,
		dispSpend65,
		dispSpend70,
		fullChartData,
		fullReturnsTimeline,
	} = p;

	const tone = statusTone(S, effWR);
	const [viewFrom, setViewFrom] = useState(age);
	const [viewTo, setViewTo] = useState(endAge);
	const effFrom = Math.min(Math.max(viewFrom, age), endAge - 1);
	const effTo = Math.min(Math.max(viewTo, effFrom + 1), endAge);

	const chartData = useMemo(
		() => fullChartData.filter((d) => d.age >= effFrom && d.age <= effTo),
		[fullChartData, effFrom, effTo],
	);
	const returnsTimeline = useMemo(
		() => fullReturnsTimeline.filter((d) => d.age >= effFrom && d.age <= effTo),
		[fullReturnsTimeline, effFrom, effTo],
	);

	const ageAxisProps = {
		dataKey: "age",
		type: "number",
		domain: [effFrom, effTo],
		tick: { fontSize: 10, fill: S.textMuted },
		tickLine: false,
		axisLine: { stroke: S.border },
	};

	const at90 = realDollars
		? deflate(getD(90).balance || 0, 90 - age, inflation)
		: getD(90).balance || 0;

	const housingLabel =
		(activePlan?.name || "Plan") +
		(activeEcon.relocates && activeEcon.newHomeCost
			? ` · buy ${fmt(activeEcon.newHomeCost)}`
			: "");

	return (
		<div style={{ display: "grid", gap: 16 }} className="fade-in">
			{/* Headline status */}
			<Card pad={0} style={{ overflow: "hidden", border: `1px solid ${tone.color}33` }}>
				<div
					style={{
						display: "flex",
						justifyContent: "space-between",
						alignItems: "center",
						gap: 16,
						flexWrap: "wrap",
						padding: "18px 20px",
						borderRadius: 16,
						background: `linear-gradient(110deg, ${tone.color}1c 0%, ${tone.color}0a 45%, transparent 100%)`,
						borderLeft: `4px solid ${tone.color}`,
					}}
				>
					<div>
						<div style={{ fontSize: 18, fontWeight: 750, color: tone.color }}>
							{!runsOut
								? "✓ Your money never runs out"
								: `⚠ Portfolio depletes at age ${runsOut.age}`}
						</div>
						<div style={{ fontSize: 12.5, color: S.textMuted, marginTop: 3 }}>
							{housingLabel} · {projections.primaryLabel}
							{retireAge > age && ` · Working until ${retireAge}`}
						</div>
					</div>
					<div style={{ textAlign: "right" }}>
						<div style={{ fontSize: 10.5, color: S.textMuted, textTransform: "uppercase", letterSpacing: 0.5 }}>
							{projections.altLabel}
						</div>
						<div
							style={{
								fontSize: 14,
								fontWeight: 700,
								color: altRunsOut ? S.danger : S.accent,
							}}
						>
							{altRunsOut ? `Runs out @ ${altRunsOut.age}` : "Survives ✓"}
						</div>
					</div>
				</div>
			</Card>

			{/* Stats */}
			<div className="stat-grid stagger">
				<StatCard label="Portfolio" value={fmt(projections.startPort)} sub="Post-transition" accent={S.blue} />
				<StatCard label={`Spend @ ${age}`} value={fmt(spendNow)} sub="Current / yr" />
				<StatCard
					label="Spend @ 65"
					value={fmt(dispSpend65)}
					sub="Medicare begins"
					color={dispSpend65 < spendNow ? S.accent : S.text}
				/>
				<StatCard label="Spend @ 70" value={fmt(dispSpend70)} sub="SS starts" color={S.accent} />
				<StatCard label="Withdrawal rate" value={`${effWR.toFixed(1)}%`} sub="Target ≤ 4%" color={wrColor(S, effWR)} accent={wrColor(S, effWR)} />
				<StatCard label="Balance @ 90" value={fmt(at90)} sub={realDollars ? "Today's $" : "Nominal"} color={at90 > 0 ? S.accent : S.danger} />
			</div>

			{/* Controls bar */}
			<div
				style={{
					display: "flex",
					alignItems: "center",
					gap: 12,
					flexWrap: "wrap",
					padding: "10px 14px",
					background: S.card,
					border: `1px solid ${S.border}`,
					borderRadius: 12,
				}}
			>
				<span style={{ fontSize: 10.5, letterSpacing: 1, textTransform: "uppercase", color: S.textDim, fontWeight: 700 }}>
					Zoom
				</span>
				<AgeRangeSlider
					from={effFrom}
					to={effTo}
					min={age}
					max={endAge}
					onChangeFrom={setViewFrom}
					onChangeTo={setViewTo}
					bg={S.border}
					active={S.accent}
					mono={S.mono}
					labelColor={S.text}
				/>
				<Segmented
					size="sm"
					value={realDollars}
					onChange={setRealDollars}
					options={[
						{ value: false, label: "Nominal $" },
						{ value: true, label: "Today's $" },
					]}
				/>
			</div>

			{/* Projection */}
			<Card>
				<CardHeader
					title="Portfolio projection"
					subtitle="Balance (left axis) under two market regimes. Spending (purple) steps down at Medicare and housing transitions; income (blue) is work + Social Security + rental — right axis."
					right={
						<span style={{ fontSize: 12, color: S.textMuted }}>
							Active:{" "}
							<span style={{ color: marketMode === "lost_decade" ? S.danger : S.accent, fontWeight: 650 }}>
								{projections.primaryLabel}
							</span>
						</span>
					}
				/>
				<ResponsiveContainer width="100%" height={300}>
					<ComposedChart data={chartData} syncId="dash" margin={{ top: 5, right: 8, bottom: 5, left: 5 }}>
						<defs>
							<linearGradient id="gradSpend" x1="0" y1="0" x2="0" y2="1">
								<stop offset="0%" stopColor={S.purple} stopOpacity={0.32} />
								<stop offset="100%" stopColor={S.purple} stopOpacity={0.02} />
							</linearGradient>
							<linearGradient id="gradPrimary" x1="0" y1="0" x2="0" y2="1">
								<stop offset="0%" stopColor={S.accent} stopOpacity={0.18} />
								<stop offset="100%" stopColor={S.accent} stopOpacity={0} />
							</linearGradient>
						</defs>
						<CartesianGrid strokeDasharray="3 3" stroke={S.border} vertical={false} />
						<XAxis {...ageAxisProps} />
						<YAxis yAxisId="bal" tickFormatter={fmt} tick={{ fontSize: 10, fill: S.textMuted }} tickLine={false} axisLine={false} width={50} />
						<YAxis yAxisId="cash" orientation="right" tickFormatter={fmt} tick={{ fontSize: 10, fill: S.textMuted }} tickLine={false} axisLine={false} width={50} />
						<Tooltip content={<ChartTip />} cursor={{ stroke: S.border }} />
						<Legend formatter={(v) => <span style={{ fontSize: 11, color: S.textMuted }}>{v}</span>} />
						{retireAge > age && (
							<ReferenceLine yAxisId="bal" x={retireAge} stroke={S.blue} strokeDasharray="4 4" label={{ value: "Retire", fontSize: 10, fill: S.blue }} />
						)}
						<ReferenceLine yAxisId="bal" x={65} stroke={S.purple} strokeDasharray="4 4" label={{ value: "Medicare", fontSize: 10, fill: S.purple }} />
						<ReferenceLine yAxisId="bal" x={ssAge} stroke={S.accent} strokeDasharray="4 4" label={{ value: "SS", fontSize: 10, fill: S.accent }} />
						{runsOut && (
							<ReferenceLine yAxisId="bal" x={runsOut.age} stroke={S.danger} label={{ value: "Depleted", fontSize: 10, fill: S.danger }} />
						)}
						<Area type="stepAfter" yAxisId="cash" dataKey="spending" name="Annual spending" fill="url(#gradSpend)" stroke={S.purple} strokeWidth={1.5} />
						<Line type="stepAfter" yAxisId="cash" dataKey="income" name="Income" stroke={S.blue} strokeWidth={1.5} dot={false} strokeDasharray="2 2" />
						<Area type="monotone" yAxisId="bal" dataKey="primary" name={projections.primaryLabel} stroke={S.accent} strokeWidth={2.6} fill="url(#gradPrimary)" dot={false} />
						<Line type="monotone" yAxisId="bal" dataKey="alt" name={projections.altLabel} stroke={S.textDim} strokeWidth={2} strokeDasharray="6 4" dot={false} opacity={0.6} />
					</ComposedChart>
				</ResponsiveContainer>

				<div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginTop: 6 }}>
					<span style={{ fontSize: 9, letterSpacing: 1, textTransform: "uppercase", color: S.textDim, fontWeight: 700 }}>
						Market returns
					</span>
					<span style={{ fontSize: 10, color: S.textMuted }}>Avg {Math.round(nomReturn * 100)}% / yr</span>
				</div>
				<ResponsiveContainer width="100%" height={56}>
					<BarChart data={returnsTimeline} syncId="dash" margin={{ top: 5, right: 8, bottom: 5, left: 5 }}>
						<XAxis {...ageAxisProps} hide />
						<YAxis hide width={50} />
						<ReferenceLine y={0} stroke={S.border} />
						<Tooltip content={<ChartTip formatter={(v) => `${(v * 100).toFixed(1)}%`} />} cursor={{ fill: S.textMuted + "10" }} />
						<Bar dataKey="ret" name={projections.primaryLabel} radius={[2, 2, 0, 0]} fillOpacity={marketMode === "historical" ? 0.35 : 0.9}>
							{returnsTimeline.map((d) => (
								<Cell key={d.age} fill={d.ret < 0 ? S.danger : S.accent} />
							))}
						</Bar>
						<ReferenceLine y={nomReturn} stroke={S.accent} strokeDasharray="4 4" strokeOpacity={marketMode === "historical" ? 1 : 0.5} />
					</BarChart>
				</ResponsiveContainer>
			</Card>

			{/* Withdrawal rate */}
			<Card>
				<CardHeader
					title="Withdrawal rate"
					subtitle="Net withdrawal (spending minus income) as a share of the portfolio. Gaps appear after depletion."
					right={
						<span style={{ fontSize: 13, fontWeight: 700, color: wrColor(S, effWR) }}>
							{effWR.toFixed(1)}% now
						</span>
					}
				/>
				<ResponsiveContainer width="100%" height={180}>
					<ComposedChart data={chartData} syncId="dash" margin={{ top: 5, right: 8, bottom: 5, left: 5 }}>
						<CartesianGrid strokeDasharray="3 3" stroke={S.border} />
						<XAxis {...ageAxisProps} />
						<YAxis tickFormatter={(v) => `${v}%`} tick={{ fontSize: 10, fill: S.textMuted }} tickLine={false} axisLine={false} width={40} />
						<Tooltip content={<ChartTip formatter={(v) => `${v.toFixed(1)}%`} />} cursor={{ stroke: S.border }} />
						<ReferenceLine y={4} stroke={S.textDim} strokeDasharray="4 4" label={{ value: "4% rule", position: "insideTopRight", fontSize: 10, fill: S.textMuted }} />
						<Line type="monotone" dataKey="wdRate" name="Withdrawal rate" stroke={S.warning} strokeWidth={2.4} dot={false} connectNulls={false} />
					</ComposedChart>
				</ResponsiveContainer>
			</Card>

			<DownturnCutControls />

			<Milestones {...{ S, age, endAge, retireAge, ssAge, ssAnnual, relocates: activeEcon.relocates, moveAge: activeEcon.moveAge, planIcon: activePlan?.icon }} />
		</div>
	);
}

function Milestones({ S, age, endAge, retireAge, ssAge, ssAnnual, relocates, moveAge, planIcon }) {
	const items = [
		...(relocates ? [{ a: moveAge, l: "Relocate", icon: planIcon || "🚚" }] : []),
		...(retireAge > age ? [{ a: retireAge, l: "Retire", icon: "🎉" }] : []),
		{ a: 59, l: "401k penalty-free", icon: "💼" },
		{ a: 62, l: "Early SS eligible", icon: "📋" },
		{ a: 65, l: "Medicare", icon: "🏥", hl: true },
		{ a: ssAge, l: `SS starts (${fmt(ssAnnual)}/yr)`, icon: "💵", hl: true },
	].filter((m) => m.a >= age && m.a <= endAge);

	return (
		<Card>
			<CardHeader title="Key milestones" />
			<div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
				{items.map((m, i) => (
					<div
						key={i}
						style={{
							display: "inline-flex",
							alignItems: "center",
							gap: 7,
							padding: "5px 11px",
							borderRadius: 999,
							border: `1px solid ${m.hl ? S.accent + "66" : S.border}`,
							background: m.hl ? S.accent + "10" : S.bg,
							fontSize: 11.5,
						}}
					>
						<span>{m.icon}</span>
						<span style={{ fontWeight: m.hl ? 650 : 450, color: m.hl ? S.accent : S.text }}>
							{m.l}
						</span>
						<span style={{ fontFamily: S.mono, color: S.textMuted }}>@{m.a}</span>
					</div>
				))}
			</div>
		</Card>
	);
}
