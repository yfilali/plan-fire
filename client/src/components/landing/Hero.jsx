import {
	ResponsiveContainer,
	ComposedChart,
	Area,
	Line,
	XAxis,
	YAxis,
	CartesianGrid,
	ReferenceLine,
	Legend,
} from "recharts";
import { useTheme } from "../../theme/ThemeProvider.jsx";
import { Button } from "../ui.jsx";

// Landing hero. Below the copy sits a replica of the app's real dashboard
// "Portfolio projection" card: two stacked panels — balance under two market
// regimes (Historical avg vs Lost decade) on top, then income vs spending
// below — with Retire / Medicare / SS milestone lines. Representative demo data.

const RETIRE = 60;
const MEDICARE = 65;
const SS_AGE = 67;

const PROJECTION = (() => {
	const rows = [];
	let hist = 150000; // "Historical avg" regime balance
	let lost = 150000; // "Lost decade" regime balance
	for (let age = 40; age <= 95; age++) {
		const salary = age < RETIRE ? 95000 : 0;
		const ss = age >= SS_AGE ? 32000 : 0;
		const spending = age < MEDICARE ? 70000 : 60000;
		const income = salary + ss;
		const net = income - spending;
		const histReturn = age < RETIRE ? 1.09 : 1.05;
		const lostReturn = age < RETIRE ? 1.055 : 1.0;
		hist = hist * histReturn + net;
		lost = lost * lostReturn + net;
		rows.push({
			age,
			hist: Math.max(Math.round(hist), 0),
			lost: Math.max(Math.round(lost), 0),
			spending,
			income,
		});
	}
	return rows;
})();

const fmtBig = (v) =>
	v >= 1e6 ? `$${(v / 1e6).toFixed(1)}M` : `$${Math.round(v / 1e3)}k`;
const fmtK = (v) => `$${Math.round(v / 1e3)}k`;

export default function Hero() {
	const S = useTheme();

	return (
		<section
			style={{
				position: "relative",
				overflow: "hidden",
				padding: "clamp(56px,9vw,104px) 0 clamp(48px,7vw,84px)",
			}}
		>
			{/* soft radial accent glow behind the hero */}
			<div
				aria-hidden="true"
				style={{
					position: "absolute",
					top: "-160px",
					left: "50%",
					transform: "translateX(-50%)",
					width: "min(900px, 120vw)",
					height: "540px",
					background: `radial-gradient(closest-side, ${S.accentSoft}, transparent 72%)`,
					pointerEvents: "none",
					zIndex: 0,
				}}
			/>

			<div
				style={{
					position: "relative",
					zIndex: 1,
					maxWidth: 1120,
					margin: "0 auto",
					padding: "0 clamp(20px,5vw,40px)",
					display: "flex",
					flexDirection: "column",
					alignItems: "center",
					textAlign: "center",
				}}
			>
				<span
					style={{
						display: "inline-flex",
						alignItems: "center",
						gap: 7,
						padding: "5px 13px",
						borderRadius: 999,
						fontSize: 12.5,
						fontWeight: 650,
						letterSpacing: 0.2,
						background: S.accentSoft,
						color: S.accent,
					}}
				>
					<span aria-hidden="true">🔥</span> Plan your escape.
				</span>

				<h1
					style={{
						margin: "20px 0 0",
						fontSize: "clamp(34px,6vw,62px)",
						fontWeight: 800,
						letterSpacing: -1,
						lineHeight: 1.04,
						color: S.text,
						maxWidth: 900,
					}}
				>
					Know the exact day you can retire.
				</h1>

				<p
					style={{
						margin: "20px auto 0",
						fontSize: 18,
						lineHeight: 1.6,
						color: S.textMuted,
						maxWidth: 640,
					}}
				>
					PlanFIRE is a FIRE-native retirement planner — model your runway,
					stress-test against real market history, and watch your
					financial-independence date update as you plan.
				</p>

				<div
					style={{
						display: "flex",
						flexWrap: "wrap",
						justifyContent: "center",
						gap: 12,
						marginTop: 30,
					}}
				>
					<a href="/signup" style={{ textDecoration: "none" }}>
						<Button variant="primary" size="lg">
							Start planning free →
						</Button>
					</a>
					<a href="#features" style={{ textDecoration: "none" }}>
						<Button variant="secondary" size="lg">
							See features
						</Button>
					</a>
				</div>

				<p style={{ marginTop: 16, fontSize: 12.5, color: S.textDim }}>
					Free forever · Open source · Private by design.
				</p>

				<ProjectionCard S={S} />
			</div>
		</section>
	);
}

// Replica of the dashboard "Portfolio projection" card.
function ProjectionCard({ S }) {
	const legendStyle = (v) => (
		<span style={{ fontSize: 11.5, color: S.textMuted }}>{v}</span>
	);
	const refLabel = (value, fill) => ({
		value,
		fontSize: 10,
		fill,
		position: "top",
	});

	return (
		<div
			style={{
				marginTop: "clamp(40px,6vw,64px)",
				width: "100%",
				maxWidth: 880,
				background: S.card,
				border: `1px solid ${S.border}`,
				borderRadius: 20,
				boxShadow: S.shadowLg,
				padding: "clamp(16px,3vw,24px)",
				textAlign: "left",
			}}
		>
			<div style={{ marginBottom: 6 }}>
				<div style={{ fontSize: 14, fontWeight: 700, color: S.text }}>
					Portfolio projection
				</div>
				<div style={{ fontSize: 12, color: S.textDim, marginTop: 3, lineHeight: 1.45 }}>
					Balance under two market regimes (top), then income vs spending
					(bottom). Spending steps down at Medicare and housing transitions.
				</div>
			</div>

			{/* Panel 1 — balance under two regimes */}
			<ResponsiveContainer width="100%" height={188}>
				<ComposedChart data={PROJECTION} margin={{ top: 22, right: 8, bottom: 0, left: 4 }}>
					<defs>
						<linearGradient id="fly-hero-hist" x1="0" y1="0" x2="0" y2="1">
							<stop offset="0%" stopColor={S.accent} stopOpacity={0.22} />
							<stop offset="100%" stopColor={S.accent} stopOpacity={0} />
						</linearGradient>
					</defs>
					<CartesianGrid strokeDasharray="3 3" stroke={S.border} vertical={false} />
					<XAxis dataKey="age" type="number" domain={[40, 95]} hide />
					<YAxis
						tickFormatter={fmtBig}
						tick={{ fontSize: 10, fill: S.textMuted }}
						tickLine={false}
						axisLine={false}
						width={46}
					/>
					<Legend formatter={legendStyle} />
					<ReferenceLine x={RETIRE} stroke={S.blue} strokeDasharray="4 4" label={refLabel("Retire", S.blue)} />
					<ReferenceLine x={MEDICARE} stroke={S.purple} strokeDasharray="4 4" label={refLabel("Medicare", S.purple)} />
					<ReferenceLine x={SS_AGE} stroke={S.accent} strokeDasharray="4 4" label={refLabel("SS", S.accent)} />
					<Line
						type="monotone"
						dataKey="lost"
						name="Lost decade"
						stroke={S.textDim}
						strokeWidth={1.6}
						strokeDasharray="5 4"
						dot={false}
						opacity={0.7}
					/>
					<Area
						type="monotone"
						dataKey="hist"
						name="Historical avg"
						stroke={S.accent}
						strokeWidth={2.8}
						fill="url(#fly-hero-hist)"
						dot={false}
					/>
				</ComposedChart>
			</ResponsiveContainer>

			{/* Panel 2 — income vs spending */}
			<div
				style={{
					fontSize: 10.5,
					fontWeight: 700,
					letterSpacing: 0.6,
					textTransform: "uppercase",
					color: S.textMuted,
					margin: "10px 0 2px",
				}}
			>
				Income vs spending
			</div>
			<ResponsiveContainer width="100%" height={148}>
				<ComposedChart data={PROJECTION} margin={{ top: 4, right: 8, bottom: 0, left: 4 }}>
					<defs>
						<linearGradient id="fly-hero-spend" x1="0" y1="0" x2="0" y2="1">
							<stop offset="0%" stopColor={S.purple} stopOpacity={0.2} />
							<stop offset="100%" stopColor={S.purple} stopOpacity={0} />
						</linearGradient>
					</defs>
					<CartesianGrid strokeDasharray="3 3" stroke={S.border} vertical={false} />
					<XAxis
						dataKey="age"
						type="number"
						domain={[40, 95]}
						ticks={[40, 50, 60, 70, 80, 90]}
						tick={{ fontSize: 10, fill: S.textMuted }}
						tickLine={false}
						axisLine={{ stroke: S.border }}
					/>
					<YAxis
						tickFormatter={fmtK}
						tick={{ fontSize: 10, fill: S.textMuted }}
						tickLine={false}
						axisLine={false}
						width={46}
					/>
					<Legend formatter={legendStyle} />
					<Area
						type="stepAfter"
						dataKey="spending"
						name="Annual spending"
						stroke={S.purple}
						strokeWidth={1.8}
						fill="url(#fly-hero-spend)"
						dot={false}
					/>
					<Line
						type="stepAfter"
						dataKey="income"
						name="Income"
						stroke={S.blue}
						strokeWidth={1.8}
						strokeDasharray="2 3"
						dot={false}
					/>
				</ComposedChart>
			</ResponsiveContainer>
		</div>
	);
}
