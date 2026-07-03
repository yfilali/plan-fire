import { useTheme } from "../../theme/ThemeProvider.jsx";

// PlanFire wordmark — a flame (FIRE) in a rounded tile, tuned to the verdant
// accent so the brand and the UI read as one system.
const GLOW = "rgba(16,185,129,0.42)";

export default function Brand() {
	const S = useTheme();
	return (
		<div style={{ display: "flex", alignItems: "center", gap: 11 }}>
			<div
				style={{
					width: 34,
					height: 34,
					borderRadius: 10,
					background: S.accentGradient,
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					flexShrink: 0,
					boxShadow: `inset 0 1px 0 rgba(255,255,255,0.22), 0 4px 14px ${GLOW}`,
				}}
			>
				<svg width="19" height="19" viewBox="0 0 24 24" aria-hidden="true">
					<path
						d="M12 2.5C12 6.5 16 8 16 12.6A4 4 0 1 1 8 12.6C8 10.3 9.4 9.6 10 8.3C10.9 9.8 10.6 6 12 2.5Z"
						fill="#fff"
					/>
				</svg>
			</div>
			<div style={{ lineHeight: 1.08 }}>
				<div
					style={{
						fontSize: 16.5,
						fontWeight: 800,
						letterSpacing: "-0.4px",
						color: S.text,
					}}
				>
					PlanFire
				</div>
				<div
					style={{
						fontSize: 10,
						color: S.textDim,
						letterSpacing: 0.4,
						textTransform: "uppercase",
						fontWeight: 600,
					}}
				>
					Retirement Planner
				</div>
			</div>
		</div>
	);
}
