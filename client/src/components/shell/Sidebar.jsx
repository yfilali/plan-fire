import { useTheme } from "../../theme/ThemeProvider.jsx";
import { useStoreStatus } from "../../usePersistedState.jsx";
import { usePlanner } from "../../state/PlannerProvider.jsx";
import { computePlanHealth, healthVisual } from "../../lib/planHealth.js";
import { FS, RAD } from "../../lib/styles.js";
import Icon from "../Icon.jsx";
import Brand from "./Brand.jsx";
import ThemeToggle from "./ThemeToggle.jsx";

const icon = (d) => (
	<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
		{d}
	</svg>
);

export const NAV = [
	{
		id: "dashboard",
		label: "Dashboard",
		icon: icon(<><path d="M3 13h8V3H3zM13 21h8v-8h-8zM13 3v6h8V3zM3 21h8v-6H3z" /></>),
	},
	{
		id: "copilot",
		label: "Co-pilot",
		icon: icon(<><path d="M12 2a7 7 0 0 1 7 7c0 3-2 5-2 7H7c0-2-2-4-2-7a7 7 0 0 1 7-7zM9 21h6M10 18v3M14 18v3" /></>),
	},
	{
		id: "income",
		label: "Income",
		icon: icon(<><path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></>),
	},
	{
		id: "expenses",
		label: "Expenses",
		icon: icon(<><path d="M3 6h18M3 12h18M3 18h12" /></>),
	},
	{
		id: "assets",
		label: "Assets",
		icon: icon(<><rect x="2" y="6" width="20" height="13" rx="2" /><path d="M2 10h20M16 14h2" /></>),
	},
	{
		id: "markets",
		label: "Markets",
		icon: icon(<><path d="M3 3v18h18" /><path d="M7 13l3-4 3 2 4-6" /></>),
	},
	{
		id: "plan",
		label: "Plans",
		icon: icon(<><path d="M3 11l9-8 9 8M5 10v10h14V10" /></>),
	},
	{
		id: "guide",
		label: "Guide",
		icon: icon(<><path d="M4 4h11a3 3 0 0 1 3 3v13H7a3 3 0 0 0-3 3z" /><path d="M9 8h6M9 12h5" /></>),
	},
	{
		id: "settings",
		label: "Settings",
		icon: icon(<><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1V21a2 2 0 1 1-4 0v-.1A1.6 1.6 0 0 0 7 19.4a1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0-1.1-2.7H1a2 2 0 1 1 0-4h.1A1.6 1.6 0 0 0 2.6 7a1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A1.6 1.6 0 0 0 7 2.6h.1A1.6 1.6 0 0 0 8 1.1V1a2 2 0 1 1 4 0v.1A1.6 1.6 0 0 0 14.6 2.6a1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V7a1.6 1.6 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z" /></>),
	},
];

export default function Sidebar({ view, setView, open, onClose }) {
	const S = useTheme();
	const { serverOk, guest } = useStoreStatus();
	const { effWR, runsOut, planIsEmpty } = usePlanner();
	// Canonical verdict — keyed on the deterministic projection (runsOut) plus
	// WR, so the sidebar agrees with the topbar badge and the dashboard banner.
	const { status, label } = computePlanHealth({ runsOut, effWR, planIsEmpty });
	const visual = healthVisual(status, S);

	return (
		<>
			<div
				className={`sidebar-scrim ${open ? "open" : ""}`}
				onClick={onClose}
			/>
			<aside className={`sidebar ${open ? "open" : ""}`}>
				<div style={{ padding: "18px 16px 14px" }}>
					<Brand />
				</div>

				<nav style={{ padding: "4px 10px", display: "grid", gap: 3 }}>
					{NAV.map((n) => (
						<button
							key={n.id}
							className={`nav-item ${view === n.id ? "active" : ""}`}
							onClick={() => {
								setView(n.id);
								onClose?.();
							}}
						>
							<span className="nav-ico">{n.icon}</span>
							{n.label}
						</button>
					))}
				</nav>

				<div style={{ flex: 1 }} />

				{/* Health summary */}
				<div style={{ padding: "12px 16px" }}>
					<div
						style={{
							borderRadius: RAD.md,
							border: `1px solid ${visual.color}40`,
							background: visual.color + "12",
							padding: "11px 13px",
						}}
					>
						<div
							style={{
								fontSize: FS.xs,
								color: S.textMuted,
								fontWeight: 600,
								textTransform: "uppercase",
								letterSpacing: 0.5,
							}}
						>
							Plan health
						</div>
						<div
							style={{
								display: "flex",
								alignItems: "baseline",
								gap: 7,
								marginTop: 3,
							}}
						>
							<span
								style={{
									display: "inline-flex",
									alignItems: "center",
									gap: 6,
									fontSize: FS.md,
									fontWeight: 700,
									color: visual.color,
								}}
							>
								<Icon name={visual.icon} size={16} color={visual.color} />
								{label}
							</span>
							{!planIsEmpty && (
								<span
									style={{
										fontSize: FS.sm,
										color: S.textMuted,
										fontFamily: S.mono,
									}}
								>
									{effWR.toFixed(1)}% WR
								</span>
							)}
						</div>
					</div>
					<div
						style={{
							display: "flex",
							alignItems: "center",
							gap: 7,
							marginTop: 11,
							fontSize: FS.xs,
							color: S.textDim,
						}}
					>
						<span
							className="pulse-dot"
							style={{
								width: 7,
								height: 7,
								borderRadius: 4,
								background: !guest && !serverOk ? S.warning : S.accent,
								boxShadow: `0 0 6px ${!guest && !serverOk ? S.warning : S.accent}`,
							}}
						/>
						{guest ? "Saved on this device" : serverOk ? "Synced to server" : "Offline — saved locally"}
					</div>

					{/* Phones only — desktop/tablet keep this in the topbar. */}
					<div
						className="show-sm"
						style={{ alignItems: "center", justifyContent: "space-between", marginTop: 11 }}
					>
						<span style={{ fontSize: FS.xs, color: S.textDim }}>Theme</span>
						<ThemeToggle />
					</div>
				</div>
			</aside>
		</>
	);
}
