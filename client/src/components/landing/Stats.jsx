import { useTheme } from "../../theme/ThemeProvider.jsx";

const STATS = [
	{ value: "1928→today", label: "real market data" },
	{ value: "1000s", label: "Monte Carlo paths" },
	{ value: "60+ yrs", label: "projected in seconds" },
	{ value: "Private", label: "never sold" },
];

export default function Stats() {
	const S = useTheme();
	return (
		<div
			style={{
				borderTop: `1px solid ${S.border}`,
				borderBottom: `1px solid ${S.border}`,
				padding: "clamp(20px,3.5vw,32px) 0",
			}}
		>
			<div
				style={{
					maxWidth: 1120,
					margin: "0 auto",
					padding: "0 clamp(20px,5vw,40px)",
					display: "flex",
					flexWrap: "wrap",
					justifyContent: "center",
					gap: "clamp(24px,6vw,72px)",
				}}
			>
				{STATS.map((s) => (
					<div key={s.value} style={{ textAlign: "center", minWidth: 120 }}>
						<div
							style={{
								fontSize: "clamp(24px,3.4vw,34px)",
								fontWeight: 800,
								color: S.text,
								lineHeight: 1.1,
								letterSpacing: "-0.01em",
							}}
						>
							{s.value}
						</div>
						<div
							style={{
								fontSize: 13,
								color: S.textMuted,
								marginTop: 6,
							}}
						>
							{s.label}
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
