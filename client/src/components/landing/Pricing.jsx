import { useState } from "react";
import { useTheme } from "../../theme/ThemeProvider.jsx";
import { Button, Badge, Segmented } from "../ui.jsx";

function Feature({ children }) {
	const S = useTheme();
	return (
		<li
			style={{
				display: "flex",
				alignItems: "flex-start",
				gap: 10,
				fontSize: 14,
				lineHeight: 1.5,
				color: S.text,
			}}
		>
			<span style={{ color: S.accent, fontWeight: 800, flexShrink: 0 }}>✓</span>
			<span>{children}</span>
		</li>
	);
}

export default function Pricing() {
	const S = useTheme();
	const [cycle, setCycle] = useState("monthly");
	const annual = cycle === "annual";

	return (
		<section
			id="pricing"
			style={{
				scrollMarginTop: 80,
				padding: "clamp(56px,9vw,100px) 0",
				background: S.bgElev,
			}}
		>
			<div
				style={{
					maxWidth: 1120,
					margin: "0 auto",
					padding: "0 clamp(20px,5vw,40px)",
				}}
			>
				<div style={{ textAlign: "center", marginBottom: "clamp(28px,4vw,44px)" }}>
					<h2
						style={{
							fontSize: "clamp(28px,4.5vw,44px)",
							fontWeight: 750,
							color: S.text,
							letterSpacing: "-0.5px",
							marginBottom: 12,
						}}
					>
						Simple, honest pricing
					</h2>
					<p
						style={{
							fontSize: 16,
							color: S.textMuted,
							maxWidth: 520,
							margin: "0 auto 24px",
							lineHeight: 1.6,
						}}
					>
						Start free and plan forever. Upgrade when you want to stress-test
						your escape.
					</p>
					<Segmented
						options={[
							{ label: "Monthly", value: "monthly" },
							{ label: "Annual", value: "annual" },
						]}
						value={cycle}
						onChange={setCycle}
					/>
				</div>

				<div
					style={{
						display: "flex",
						flexWrap: "wrap",
						justifyContent: "center",
						alignItems: "stretch",
						gap: 24,
					}}
				>
					{/* FREE */}
					<div
						style={{
							flex: "1 1 320px",
							maxWidth: 320,
							background: S.card,
							border: `1px solid ${S.border}`,
							borderRadius: 18,
							boxShadow: S.shadowSm,
							padding: 28,
							display: "flex",
							flexDirection: "column",
						}}
					>
						<div style={{ fontSize: 13, fontWeight: 700, letterSpacing: 0.6, textTransform: "uppercase", color: S.textMuted }}>
							Free
						</div>
						<div style={{ display: "flex", alignItems: "baseline", gap: 6, margin: "14px 0 4px" }}>
							<span style={{ fontSize: 40, fontWeight: 800, color: S.text, fontFamily: S.mono, letterSpacing: "-1px" }}>
								$0
							</span>
						</div>
						<div style={{ fontSize: 14, color: S.textMuted, marginBottom: 22 }}>
							Everything to start planning
						</div>
						<ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 12, margin: 0, padding: 0, flex: 1 }}>
							<Feature>Core projection engine</Feature>
							<Feature>Plan comparison</Feature>
							<Feature>Save &amp; sync</Feature>
							<Feature>Guest mode</Feature>
						</ul>
						<a href="/signup" style={{ textDecoration: "none", marginTop: 26, display: "block" }}>
							<Button variant="secondary" full>
								Start free
							</Button>
						</a>
					</div>

					{/* PRO */}
					<div
						style={{
							flex: "1 1 320px",
							maxWidth: 320,
							position: "relative",
							background: S.accentSoft,
							border: `2px solid ${S.accent}`,
							borderRadius: 18,
							boxShadow: S.shadowMd,
							padding: 28,
							display: "flex",
							flexDirection: "column",
						}}
					>
						<div
							style={{
								position: "absolute",
								top: -13,
								left: "50%",
								transform: "translateX(-50%)",
							}}
						>
							<Badge color={S.accent}>Popular</Badge>
						</div>
						<div style={{ fontSize: 13, fontWeight: 700, letterSpacing: 0.6, textTransform: "uppercase", color: S.accent }}>
							Pro
						</div>
						<div style={{ display: "flex", alignItems: "baseline", gap: 8, margin: "14px 0 4px", minHeight: 48 }}>
							<span style={{ fontSize: 40, fontWeight: 800, color: S.text, fontFamily: S.mono, letterSpacing: "-1px" }}>
								{annual ? "$49" : "$6"}
							</span>
							<span style={{ fontSize: 16, color: S.textMuted, fontWeight: 600 }}>
								{annual ? "/ yr" : "/ mo"}
							</span>
						</div>
						<div style={{ fontSize: 13, color: S.textMuted, marginBottom: 22, minHeight: 18 }}>
							{annual ? "≈ $4.08/mo · save 32%" : "Billed monthly, cancel anytime"}
						</div>
						<div style={{ fontSize: 13, fontWeight: 650, color: S.text, marginBottom: 12 }}>
							Everything in Free, plus:
						</div>
						<ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 12, margin: 0, padding: 0, flex: 1 }}>
							<Feature>Monte Carlo success probability</Feature>
							<Feature>AI Co-pilot</Feature>
							<Feature>Time Machine (1928→today)</Feature>
							<Feature>Priority support</Feature>
						</ul>
						<a href="/signup" style={{ textDecoration: "none", marginTop: 26, display: "block" }}>
							<Button variant="primary" full>
								Go Pro
							</Button>
						</a>
					</div>
				</div>

				<p
					style={{
						textAlign: "center",
						fontSize: 14,
						color: S.textMuted,
						marginTop: 28,
					}}
				>
					Or pay once — $149 for lifetime access.
				</p>
			</div>
		</section>
	);
}
