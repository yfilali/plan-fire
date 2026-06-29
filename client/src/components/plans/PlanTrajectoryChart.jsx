import { useTheme } from "../../theme/ThemeProvider.jsx";
import { Card, CardHeader, ChartTip } from "../ui.jsx";
import { fmt, deflate } from "../../engine.js";
import {
	ResponsiveContainer,
	LineChart,
	Line,
	XAxis,
	YAxis,
	Tooltip,
	Legend,
	CartesianGrid,
	ReferenceLine,
} from "recharts";

// Overlay of every plan's portfolio balance over age. The active plan is drawn
// thicker and at full opacity; the others recede. Optionally deflated to
// today's dollars when `realDollars` is on.
export default function PlanTrajectoryChart({ outcomes, realDollars, age, inflation, activePlanId }) {
	const S = useTheme();

	const list = Array.isArray(outcomes) ? outcomes.filter(Boolean) : [];
	if (list.length === 0) {
		return (
			<Card>
				<CardHeader title="Portfolio trajectories" />
				<div style={{ fontSize: 12, color: S.textMuted, padding: "8px 2px" }}>
					No plans to chart yet.
				</div>
			</Card>
		);
	}

	const colorFor = (o) => S[o.tone] || S.accent;

	// Merge every plan's series into rows keyed by age: { age, [planId]: balance }.
	const rowsByAge = new Map();
	for (const o of list) {
		const series = Array.isArray(o.series) ? o.series : [];
		for (const pt of series) {
			let row = rowsByAge.get(pt.age);
			if (!row) {
				row = { age: pt.age };
				rowsByAge.set(pt.age, row);
			}
			const bal = realDollars ? deflate(pt.balance, pt.age - age, inflation) : pt.balance;
			row[o.planId] = bal;
		}
	}
	const data = Array.from(rowsByAge.values()).sort((a, b) => a.age - b.age);

	return (
		<Card>
			<CardHeader
				title="Portfolio trajectories"
				subtitle={realDollars ? "Balance over age · today's dollars" : "Balance over age · nominal dollars"}
			/>
			<ResponsiveContainer width="100%" height={260}>
				<LineChart data={data} margin={{ top: 5, right: 8, bottom: 0, left: 5 }}>
					<CartesianGrid strokeDasharray="3 3" stroke={S.border} vertical={false} />
					<XAxis
						dataKey="age"
						tick={{ fontSize: 10, fill: S.textMuted }}
						tickLine={false}
						axisLine={false}
					/>
					<YAxis
						tickFormatter={fmt}
						tick={{ fontSize: 10, fill: S.textMuted }}
						tickLine={false}
						axisLine={false}
						width={52}
					/>
					<Tooltip content={<ChartTip />} cursor={{ stroke: S.border }} />
					<Legend formatter={(v) => <span style={{ fontSize: 11, color: S.textMuted }}>{v}</span>} />
					<ReferenceLine y={0} stroke={S.danger} strokeDasharray="4 4" />
					{list.map((o) => {
						const isActive = o.planId === activePlanId;
						return (
							<Line
								key={o.planId}
								type="monotone"
								dataKey={o.planId}
								name={o.name}
								stroke={colorFor(o)}
								strokeWidth={isActive ? 2.8 : 1.6}
								opacity={isActive ? 1 : 0.7}
								dot={false}
								connectNulls
								isAnimationActive={false}
							/>
						);
					})}
				</LineChart>
			</ResponsiveContainer>
		</Card>
	);
}
