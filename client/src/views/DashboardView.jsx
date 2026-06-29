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
import { wrColor } from "../lib/status.js";
import { computePlanHealth, healthVisual } from "../lib/planHealth.js";
import { Card, CardHeader, StatCard, Segmented, ChartTip, SectionTitle } from "../components/ui.jsx";
import Icon from "../components/Icon.jsx";
import InfoTip from "../components/InfoTip.jsx";
import { FS, RAD, FW } from "../lib/styles.js";
import { AgeRangeSlider } from "../AgeRangeSlider.jsx";
import DownturnCutControls from "../components/DownturnCutControls.jsx";
import SuccessProbability from "../components/dashboard/SuccessProbability.jsx";
import MilestonesCard from "../components/dashboard/Milestones.jsx";
import RegimeSelector from "../components/dashboard/RegimeSelector.jsx";

// Small uppercase eyebrow used to separate the controls / results sub-zones.
function Eyebrow({ children, style }) {
	const S = useTheme();
	return (
		<span
			style={{
				fontSize: FS.xs,
				letterSpacing: 1,
				textTransform: "uppercase",
				color: S.textDim,
				fontWeight: FW.bold,
				...style,
			}}
		>
			{children}
		</span>
	);
}

export default function DashboardView() {
	const S = useTheme();
	const p = usePlanner();
	const {
		age,
		retireAge,
		ssAge,
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

	// Unified verdict — one source of truth for headline color + wording, so a
	// positive outcome is never painted alarm-red. Monte Carlo lives in its own
	// card (SuccessProbability) and simply doesn't vote here.
	const health = computePlanHealth({ runsOut, effWR });
	const visual = healthVisual(health.status, S);

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

	const dollarsLabel = realDollars ? "Today's $" : "Nominal $";

	return (
		<div style={{ display: "grid", gap: 16 }} className="fade-in">
			{/* ── Headline status — color + icon + word all follow the unified verdict ── */}
			<Card pad={0} style={{ overflow: "hidden", border: `1px solid ${visual.color}33` }}>
				<div
					style={{
						display: "flex",
						justifyContent: "space-between",
						alignItems: "center",
						gap: 16,
						flexWrap: "wrap",
						padding: "18px 20px",
						borderRadius: RAD.lg,
						background: `linear-gradient(110deg, ${visual.color}1c 0%, ${visual.color}0a 45%, transparent 100%)`,
						borderLeft: `4px solid ${visual.color}`,
					}}
				>
					<div style={{ minWidth: 0 }}>
						<div style={{ display: "flex", alignItems: "center", gap: 9, flexWrap: "wrap" }}>
							<Icon name={visual.icon} size={20} color={visual.color} />
							<span style={{ fontSize: FS.lg, fontWeight: FW.bold, color: visual.color }}>
								{!runsOut
									? "Your money lasts the whole plan"
									: `Portfolio depletes at age ${runsOut.age}`}
							</span>
							<span
								style={{
									fontSize: FS.xs,
									fontWeight: FW.bold,
									textTransform: "uppercase",
									letterSpacing: 0.6,
									color: visual.color,
									background: `${visual.color}1e`,
									border: `1px solid ${visual.color}55`,
									borderRadius: RAD.pill,
									padding: "2px 9px",
								}}
							>
								{visual.label}
							</span>
						</div>
						<div style={{ fontSize: FS.sm, color: S.textMuted, marginTop: 5, lineHeight: 1.5 }}>
							{health.reasons.join(" · ")}
						</div>
						<div style={{ fontSize: FS.xs, color: S.textDim, marginTop: 3 }}>
							{housingLabel} · {projections.primaryLabel}
							{retireAge > age && ` · Working until ${retireAge}`}
						</div>
					</div>
					<div style={{ textAlign: "right" }}>
						<div style={{ fontSize: FS.xs, color: S.textMuted, textTransform: "uppercase", letterSpacing: 0.5 }}>
							{projections.altLabel}
						</div>
						<div
							style={{
								display: "inline-flex",
								alignItems: "center",
								gap: 6,
								marginTop: 2,
								fontSize: FS.md,
								fontWeight: FW.bold,
								color: altRunsOut ? S.danger : S.accent,
							}}
						>
							<Icon name={altRunsOut ? "x-circle" : "check"} size={15} color={altRunsOut ? S.danger : S.accent} />
							{altRunsOut ? `Runs out @ ${altRunsOut.age}` : "Survives"}
						</div>
					</div>
				</div>
			</Card>

			{/* ── Headline metrics ── */}
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
				<StatCard label="Balance @ 90" value={fmt(at90)} sub={dollarsLabel} color={at90 > 0 ? S.accent : S.danger} />
			</div>

			{/* ════ CONTROLS ════ Inputs that reshape every result below. */}
			<section>
				<SectionTitle sub="Adjust the view and stress assumptions — every result below reacts to these.">
					Controls
				</SectionTitle>
				<div style={{ display: "grid", gap: 12 }}>
					<div
						style={{
							display: "flex",
							alignItems: "center",
							gap: 14,
							flexWrap: "wrap",
							padding: "10px 14px",
							background: S.card,
							border: `1px solid ${S.border}`,
							borderRadius: RAD.md,
						}}
					>
						<Eyebrow>Zoom</Eyebrow>
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
						<span style={{ display: "inline-flex", alignItems: "center", gap: 6, marginLeft: "auto" }}>
							<Eyebrow>Dollars</Eyebrow>
							<InfoTip term="real vs nominal dollars" />
							<Segmented
								size="sm"
								value={realDollars}
								onChange={setRealDollars}
								options={[
									{ value: false, label: "Nominal $" },
									{ value: true, label: "Today's $" },
								]}
							/>
						</span>
					</div>
					<DownturnCutControls />
				</div>
			</section>

			{/* ════ RESULTS ════ Everything the controls produce. */}
			<section>
				<SectionTitle sub={`Projection, odds and milestones — shown in ${dollarsLabel.toLowerCase()}.`}>
					Results
				</SectionTitle>
				<div style={{ display: "grid", gap: 16 }}>
					{/* Projection — split into two stacked charts sharing one x-axis so the
					    balance scale never collides with the income/spending scale. */}
					<Card>
						<CardHeader
							title="Portfolio projection"
							subtitle="Balance under two market regimes (top), then income vs spending (bottom). Spending steps down at Medicare and housing transitions."
							right={
								<span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
									<InfoTip term="regime" />
									<RegimeSelector />
								</span>
							}
						/>

						{/* Balance — the primary line is the dominant, full-opacity mark. */}
						<ResponsiveContainer width="100%" height={210}>
							<ComposedChart data={chartData} syncId="dash" margin={{ top: 5, right: 8, bottom: 0, left: 5 }}>
								<defs>
									<linearGradient id="gradPrimary" x1="0" y1="0" x2="0" y2="1">
										<stop offset="0%" stopColor={S.accent} stopOpacity={0.22} />
										<stop offset="100%" stopColor={S.accent} stopOpacity={0} />
									</linearGradient>
								</defs>
								<CartesianGrid strokeDasharray="3 3" stroke={S.border} vertical={false} />
								<XAxis {...ageAxisProps} hide />
								<YAxis tickFormatter={fmt} tick={{ fontSize: 10, fill: S.textMuted }} tickLine={false} axisLine={false} width={52} />
								<Tooltip content={<ChartTip />} cursor={{ stroke: S.border }} />
								<Legend formatter={(v) => <span style={{ fontSize: FS.xs, color: S.textMuted }}>{v}</span>} />
								{retireAge > age && (
									<ReferenceLine x={retireAge} stroke={S.blue} strokeDasharray="4 4" label={{ value: "Retire", fontSize: 10, fill: S.blue }} />
								)}
								<ReferenceLine x={65} stroke={S.purple} strokeDasharray="4 4" label={{ value: "Medicare", fontSize: 10, fill: S.purple }} />
								<ReferenceLine x={ssAge} stroke={S.accent} strokeDasharray="4 4" label={{ value: "SS", fontSize: 10, fill: S.accent }} />
								{runsOut && (
									<ReferenceLine x={runsOut.age} stroke={S.danger} label={{ value: "Depleted", fontSize: 10, fill: S.danger }} />
								)}
								{/* alt drawn first (behind), de-emphasized; primary on top, dominant */}
								<Line type="monotone" dataKey="alt" name={projections.altLabel} stroke={S.textDim} strokeWidth={1.6} strokeDasharray="5 4" dot={false} opacity={0.5} />
								<Area type="monotone" dataKey="primary" name={projections.primaryLabel} stroke={S.accent} strokeWidth={2.8} fill="url(#gradPrimary)" dot={false} />
							</ComposedChart>
						</ResponsiveContainer>

						{/* Income vs spending — own axis, no longer fighting the balance scale. */}
						<Eyebrow style={{ display: "block", marginTop: 10, marginBottom: 2 }}>Income vs spending</Eyebrow>
						<ResponsiveContainer width="100%" height={130}>
							<ComposedChart data={chartData} syncId="dash" margin={{ top: 5, right: 8, bottom: 5, left: 5 }}>
								<defs>
									<linearGradient id="gradSpend" x1="0" y1="0" x2="0" y2="1">
										<stop offset="0%" stopColor={S.purple} stopOpacity={0.32} />
										<stop offset="100%" stopColor={S.purple} stopOpacity={0.02} />
									</linearGradient>
								</defs>
								<CartesianGrid strokeDasharray="3 3" stroke={S.border} vertical={false} />
								<XAxis {...ageAxisProps} />
								<YAxis tickFormatter={fmt} tick={{ fontSize: 10, fill: S.textMuted }} tickLine={false} axisLine={false} width={52} />
								<Tooltip content={<ChartTip />} cursor={{ stroke: S.border }} />
								<Legend formatter={(v) => <span style={{ fontSize: FS.xs, color: S.textMuted }}>{v}</span>} />
								<Area type="stepAfter" dataKey="spending" name="Annual spending" fill="url(#gradSpend)" stroke={S.purple} strokeWidth={1.6} dot={false} />
								<Line type="stepAfter" dataKey="income" name="Income" stroke={S.blue} strokeWidth={1.8} dot={false} strokeDasharray="2 2" />
							</ComposedChart>
						</ResponsiveContainer>

						{/* Per-year market returns */}
						<div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginTop: 10 }}>
							<Eyebrow>Market returns</Eyebrow>
							<span style={{ fontSize: FS.xs, color: S.textMuted }}>Avg {Math.round(nomReturn * 100)}% / yr</span>
						</div>
						<ResponsiveContainer width="100%" height={56}>
							<BarChart data={returnsTimeline} syncId="dash" margin={{ top: 5, right: 8, bottom: 5, left: 5 }}>
								<XAxis {...ageAxisProps} hide />
								<YAxis hide width={52} />
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

					{/* Monte Carlo success (leaf) */}
					<SuccessProbability />

					{/* Withdrawal rate */}
					<Card>
						<CardHeader
							title="Withdrawal rate"
							subtitle="Net withdrawal (spending minus income) as a share of the portfolio. Gaps appear after depletion."
							right={
								<span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
									<span style={{ fontSize: FS.base, fontWeight: FW.bold, color: wrColor(S, effWR) }}>
										{effWR.toFixed(1)}% now
									</span>
									<InfoTip term="WR" />
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

					{/* Milestones (leaf) — one card, two labeled groups */}
					<MilestonesCard />
				</div>
			</section>
		</div>
	);
}
