import { useTheme } from "../../theme/ThemeProvider.jsx";

// Brand mark gradient. Swap to the "Verdant" green to match the UI accent:
//   FLAME = "linear-gradient(135deg, #22c55e, #0d9488)"; GLOW = "rgba(34,197,94,0.4)"
const FLAME = "linear-gradient(135deg, #f59e0b, #f43f5e)";
const GLOW = "rgba(245,158,11,0.45)";

// Firly wordmark — a warm flame (FIRE) in a rounded gradient tile.
export default function Brand() {
	const S = useTheme();
	return (
		<div style={{ display: "flex", alignItems: "center", gap: 10 }}>
			<div
				style={{
					width: 32,
					height: 32,
					borderRadius: 9,
					background: FLAME,
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					flexShrink: 0,
					boxShadow: `0 2px 10px ${GLOW}`,
				}}
			>
				<svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
					<path
						d="M12 2.5C12 6.5 16 8 16 12.6A4 4 0 1 1 8 12.6C8 10.3 9.4 9.6 10 8.3C10.9 9.8 10.6 6 12 2.5Z"
						fill="#fff"
					/>
				</svg>
			</div>
			<div style={{ lineHeight: 1.05 }}>
				<div style={{ fontSize: 16, fontWeight: 800, letterSpacing: "-0.3px", color: S.text }}>
					Firly
				</div>
				<div style={{ fontSize: 10, color: S.textMuted, letterSpacing: 0.3 }}>
					Retirement Planner
				</div>
			</div>
		</div>
	);
}
