import { useTheme } from "../../theme/ThemeProvider.jsx";
import { Badge } from "../ui.jsx";

const FEATURES = [
	{
		emoji: "📈",
		title: "Projection engine",
		desc: "See your savings runway and financial-independence date update in real time as you tune income, spending, and returns.",
	},
	{
		emoji: "🧭",
		title: "Plan comparison",
		desc: "Model housing moves, retirement ages, and what-ifs side by side.",
	},
	{
		emoji: "🎲",
		title: "Monte Carlo confidence",
		pro: true,
		desc: "Run thousands of randomized market paths and see the odds your money outlives you.",
	},
	{
		emoji: "✨",
		title: "AI Co-pilot",
		pro: true,
		desc: "Ask ‘Can I retire at 52?’ and get answers grounded in your real numbers — with one-tap changes.",
	},
	{
		emoji: "⏳",
		title: "Time Machine",
		pro: true,
		desc: "Replay real market eras since 1928 — Stagflation, the GFC, the Long Bull — on your actual portfolio.",
	},
];

export default function Features() {
	const S = useTheme();
	return (
		<section
			id="features"
			style={{
				scrollMarginTop: 80,
				padding: "clamp(56px,9vw,100px) 0",
			}}
		>
			<div
				style={{
					maxWidth: 1120,
					margin: "0 auto",
					padding: "0 clamp(20px,5vw,40px)",
				}}
			>
				<h2
					style={{
						fontSize: "clamp(28px,4.5vw,44px)",
						fontWeight: 800,
						color: S.text,
						letterSpacing: "-0.02em",
						lineHeight: 1.1,
						textAlign: "center",
					}}
				>
					Everything you need to reach FI
				</h2>
				<p
					style={{
						fontSize: "clamp(15px,1.8vw,18px)",
						color: S.textMuted,
						textAlign: "center",
						maxWidth: 620,
						margin: "14px auto 0",
						lineHeight: 1.55,
					}}
				>
					From your first projection to stress-testing against a century of real
					markets — the whole path to financial independence, in one place.
				</p>

				<div
					style={{
						marginTop: "clamp(36px,5vw,52px)",
						display: "grid",
						gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
						gap: 20,
					}}
				>
					{FEATURES.map((f) => (
						<div
							key={f.title}
							className="lift"
							style={{
								background: S.card,
								border: `1px solid ${S.border}`,
								borderRadius: 16,
								padding: 22,
								boxShadow: S.shadowSm,
							}}
						>
							<div
								style={{
									width: 46,
									height: 46,
									borderRadius: 12,
									background: S.accentSoft,
									display: "flex",
									alignItems: "center",
									justifyContent: "center",
									fontSize: 24,
									marginBottom: 14,
								}}
							>
								{f.emoji}
							</div>
							<div
								style={{
									display: "flex",
									alignItems: "center",
									gap: 8,
									flexWrap: "wrap",
									marginBottom: 7,
								}}
							>
								<span
									style={{
										fontSize: 17,
										fontWeight: 700,
										color: S.text,
									}}
								>
									{f.title}
								</span>
								{f.pro && <Badge color={S.accent}>Pro</Badge>}
							</div>
							<p
								style={{
									fontSize: 14,
									color: S.textMuted,
									lineHeight: 1.55,
									margin: 0,
								}}
							>
								{f.desc}
							</p>
						</div>
					))}
				</div>
			</div>
		</section>
	);
}
