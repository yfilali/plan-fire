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

// Landing hero. Copy sits over a soft radial accent glow; below it a product
// card showing the same "Portfolio projection" chart the app renders on the
// dashboard (recharts area of balance-by-age with Retire / Medicare / SS
// reference lines), populated with representative demo figures.

// Representative accumulation → drawdown trajectory for two plans.
const RETIRE = 57;
const MEDICARE = 65;
const SS_AGE = 67;
const PROJECTION = (() => {
	const rows = [];
	let a = 190000; // "Your plan" balance
	let b = 165000; // "Alternative plan" balance
	for (let age = 40; age <= 95; age++) {
		if (age <= RETIRE) {
			a = a * 1.1 + 27000;
			b = b * 1.085 + 19000;
		} else {
			const ss = age >= SS_AGE ? 30000 : 0;
			a = a * 1.035 - (120000 - ss);
			b = b * 1.03 - (112000 - ss);
		}
		rows.push({
			age,
			primary: Math.max(Math.round(a), 0),
			alt: Math.max(Math.round(b), 0),
		});
	}
	return rows;
})();

const fmtMoney = (v) =>
	v >= 1e6 ? `$${(v / 1e6).toFixed(1)}M` : `$${Math.round(v / 1e3)}k`;

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
				{/* eyebrow pill */}
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
					Firely is a FIRE-native retirement planner — model your runway,
					stress-test against real market history, and watch your
					financial-independence date update as you plan.
				</p>

				{/* CTA row */}
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
					Free to start · Private by design · No card required.
				</p>

				{/* product visual — the real dashboard projection chart */}
				<ProjectionCard S={S} />
			</div>
		</section>
	);
}

// Mirrors the app's "Portfolio projection" card: an accent-gradient area for
// the active plan, a dashed alternative-plan line, and dashed Retire /
// Medicare / SS reference lines over an age axis.
function ProjectionCard({ S }) {
	return (
		<div
			style={{
				marginTop: "clamp(40px,6vw,64px)",
				width: "100%",
				maxWidth: 860,
				background: S.card,
				border: `1px solid ${S.border}`,
				borderRadius: 20,
				boxShadow: S.shadowLg,
				padding: "clamp(16px,3vw,24px)",
				textAlign: "left",
			}}
		>
			<div style={{ marginBottom: 12 }}>
				<div style={{ fontSize: 14, fontWeight: 700, color: S.text }}>
					Portfolio projection
				</div>
				<div style={{ fontSize: 12, color: S.textDim, marginTop: 3 }}>
					Balance by age, with your retirement, Medicare, and Social Security
					milestones.
				</div>
			</div>

			<ResponsiveContainer width="100%" height={264}>
				<ComposedChart
					data={PROJECTION}
					margin={{ top: 8, right: 10, bottom: 0, left: 4 }}
				>
					<defs>
						<linearGradient id="fly-hero-primary" x1="0" y1="0" x2="0" y2="1">
							<stop offset="0%" stopColor={S.accent} stopOpacity={0.22} />
							<stop offset="100%" stopColor={S.accent} stopOpacity={0} />
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
						tickFormatter={(v) => `${v}`}
					/>
					<YAxis
						tickFormatter={fmtMoney}
						tick={{ fontSize: 10, fill: S.textMuted }}
						tickLine={false}
						axisLine={false}
						width={48}
					/>
					<Legend
						formatter={(v) => (
							<span style={{ fontSize: 11.5, color: S.textMuted }}>{v}</span>
						)}
					/>
					<ReferenceLine
						x={RETIRE}
						stroke={S.blue}
						strokeDasharray="4 4"
						label={{ value: "Retire", fontSize: 10, fill: S.blue, position: "top" }}
					/>
					<ReferenceLine
						x={MEDICARE}
						stroke={S.purple}
						strokeDasharray="4 4"
						label={{ value: "Medicare", fontSize: 10, fill: S.purple, position: "top" }}
					/>
					<ReferenceLine
						x={SS_AGE}
						stroke={S.accent}
						strokeDasharray="4 4"
						label={{ value: "SS", fontSize: 10, fill: S.accent, position: "top" }}
					/>
					<Line
						type="monotone"
						dataKey="alt"
						name="Alternative plan"
						stroke={S.textDim}
						strokeWidth={1.6}
						strokeDasharray="5 4"
						dot={false}
						opacity={0.55}
					/>
					<Area
						type="monotone"
						dataKey="primary"
						name="Your plan"
						stroke={S.accent}
						strokeWidth={2.8}
						fill="url(#fly-hero-primary)"
						dot={false}
					/>
				</ComposedChart>
			</ResponsiveContainer>
		</div>
	);
}
