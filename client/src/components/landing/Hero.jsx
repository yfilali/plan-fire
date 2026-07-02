import { useTheme } from "../../theme/ThemeProvider.jsx";
import { Button } from "../ui.jsx";

// Landing hero. Copy is centered over a soft radial accent glow; below it a
// faux "runway" product card built entirely from divs + inline SVG (no images)
// so it renders crisply on any background and tracks the theme accent.
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

				{/* faux product visual */}
				<RunwayCard S={S} />
			</div>
		</section>
	);
}

// Rounded white card containing a "runway" area chart and a few stat chips.
function RunwayCard({ S }) {
	// A gently accelerating runway curve that peaks at the FI point.
	const W = 720;
	const H = 260;
	const pts = [
		[0, 210],
		[90, 196],
		[180, 178],
		[270, 150],
		[360, 128],
		[450, 96],
		[540, 70],
		[630, 46],
		[720, 30],
	];
	const line = pts.map((p, i) => `${i ? "L" : "M"}${p[0]},${p[1]}`).join(" ");
	const area = `${line} L${W},${H} L0,${H} Z`;
	const fi = pts[pts.length - 1]; // FI point at the top-right

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
			{/* card header row */}
			<div
				style={{
					display: "flex",
					alignItems: "center",
					justifyContent: "space-between",
					gap: 12,
					marginBottom: 16,
					flexWrap: "wrap",
				}}
			>
				<div>
					<div style={{ fontSize: 13, fontWeight: 700, color: S.text }}>
						Your runway to financial independence
					</div>
					<div style={{ fontSize: 12, color: S.textDim, marginTop: 3 }}>
						Projected net worth · age 32 → 50
					</div>
				</div>
				<div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
					<StatChip S={S} label="FI date" value="2041" accent />
					<StatChip S={S} label="Success" value="92%" />
					<StatChip S={S} label="Coast age" value="46" />
				</div>
			</div>

			{/* runway area chart */}
			<div style={{ position: "relative", width: "100%" }}>
				<svg
					viewBox={`0 0 ${W} ${H}`}
					preserveAspectRatio="none"
					width="100%"
					height="clamp(160px,26vw,240px)"
					role="img"
					aria-label="Rising net-worth runway reaching the financial-independence point"
					style={{ display: "block" }}
				>
					<defs>
						<linearGradient id="fly-hero-fill" x1="0" y1="0" x2="0" y2="1">
							<stop offset="0%" stopColor={S.accent} stopOpacity="0.34" />
							<stop offset="100%" stopColor={S.accent} stopOpacity="0.02" />
						</linearGradient>
					</defs>

					{/* faint baseline gridlines */}
					{[0.25, 0.5, 0.75].map((f) => (
						<line
							key={f}
							x1="0"
							x2={W}
							y1={H * f}
							y2={H * f}
							stroke={S.border}
							strokeWidth="1"
						/>
					))}

					<path d={area} fill="url(#fly-hero-fill)" />
					<path
						d={line}
						fill="none"
						stroke={S.accent}
						strokeWidth="3"
						strokeLinecap="round"
						strokeLinejoin="round"
					/>

					{/* FI point marker */}
					<circle cx={fi[0]} cy={fi[1]} r="10" fill={S.accent} opacity="0.18" />
					<circle
						cx={fi[0]}
						cy={fi[1]}
						r="5"
						fill={S.card}
						stroke={S.accent}
						strokeWidth="3"
					/>
				</svg>

				{/* FI flag label pinned near the top-right endpoint */}
				<div
					style={{
						position: "absolute",
						top: 4,
						right: 6,
						display: "inline-flex",
						alignItems: "center",
						gap: 6,
						padding: "4px 10px",
						borderRadius: 999,
						fontSize: 11.5,
						fontWeight: 650,
						background: S.accentSoft,
						color: S.accent,
						border: `1px solid ${S.accent}33`,
					}}
				>
					<span aria-hidden="true">◎</span> FI reached
				</div>
			</div>
		</div>
	);
}

function StatChip({ S, label, value, accent = false }) {
	return (
		<div
			style={{
				padding: "7px 12px",
				borderRadius: 12,
				background: accent ? S.accentSoft : S.bg,
				border: `1px solid ${accent ? S.accent + "33" : S.border}`,
				minWidth: 78,
			}}
		>
			<div
				style={{
					fontSize: 9.5,
					fontWeight: 700,
					letterSpacing: 0.6,
					textTransform: "uppercase",
					color: S.textMuted,
				}}
			>
				{label}
			</div>
			<div
				style={{
					fontSize: 17,
					fontWeight: 750,
					fontFamily: S.mono,
					color: accent ? S.accent : S.text,
					lineHeight: 1.2,
				}}
			>
				{value}
			</div>
		</div>
	);
}
