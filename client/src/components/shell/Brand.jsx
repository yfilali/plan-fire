import { useTheme } from "../../theme/ThemeProvider.jsx";

// Compact wordmark used in the sidebar header.
export default function Brand() {
	const S = useTheme();
	return (
		<div style={{ display: "flex", alignItems: "center", gap: 10 }}>
			<div
				style={{
					width: 32,
					height: 32,
					borderRadius: 9,
					background: `linear-gradient(135deg, ${S.accent}, ${S.blue})`,
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					flexShrink: 0,
					boxShadow: `0 2px 8px ${S.accent}55`,
				}}
			>
				<svg width="17" height="17" viewBox="0 0 24 24" fill="none">
					<path
						d="M4 19V11M9 19V5M14 19v-6M19 19V8"
						stroke="#fff"
						strokeWidth="2.4"
						strokeLinecap="round"
					/>
				</svg>
			</div>
			<div style={{ lineHeight: 1.05 }}>
				<div style={{ fontSize: 15, fontWeight: 750, color: S.text }}>
					Fathom
				</div>
				<div style={{ fontSize: 10, color: S.textMuted, letterSpacing: 0.3 }}>
					Retirement Planner
				</div>
			</div>
		</div>
	);
}
