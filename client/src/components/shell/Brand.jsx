import { useTheme } from "../../theme/ThemeProvider.jsx";

// PlanFIRE wordmark — a fire-colored flame on a dark tile. The "FIRE" in the
// wordmark is rendered in the same fire gradient so brand and mark read as one.
const FIRE = "linear-gradient(180deg,#fde047 0%,#f97316 55%,#ef4444 100%)";

export default function Brand() {
	const S = useTheme();
	return (
		<div style={{ display: "flex", alignItems: "center", gap: 11 }}>
			<div
				style={{
					width: 34,
					height: 34,
					borderRadius: 10,
					background: "#1b1613",
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					flexShrink: 0,
					boxShadow:
						"inset 0 1px 0 rgba(255,255,255,0.12), 0 4px 16px rgba(249,115,22,0.45)",
				}}
			>
				<svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
					<defs>
						<linearGradient id="planfire-flame" x1="0" y1="0" x2="0" y2="1">
							<stop offset="0%" stopColor="#fde047" />
							<stop offset="55%" stopColor="#f97316" />
							<stop offset="100%" stopColor="#ef4444" />
						</linearGradient>
					</defs>
					<path
						d="M12 2.5C12 6.5 16 8 16 12.6A4 4 0 1 1 8 12.6C8 10.3 9.4 9.6 10 8.3C10.9 9.8 10.6 6 12 2.5Z"
						fill="url(#planfire-flame)"
					/>
				</svg>
			</div>
			<div style={{ lineHeight: 1.08 }}>
				<div style={{ fontSize: 16.5, fontWeight: 800, letterSpacing: "-0.4px" }}>
					<span style={{ color: S.text }}>Plan</span>
					<span
						style={{
							backgroundImage: FIRE,
							WebkitBackgroundClip: "text",
							backgroundClip: "text",
							color: "transparent",
							WebkitTextFillColor: "transparent",
						}}
					>
						FIRE
					</span>
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
