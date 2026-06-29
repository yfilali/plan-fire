import { useTheme } from "../../theme/ThemeProvider.jsx";
import { usePlanner } from "../../state/PlannerProvider.jsx";
import { computePlanHealth, healthVisual } from "../../lib/planHealth.js";
import { FS } from "../../lib/styles.js";
import { Badge, IconButton } from "../ui.jsx";
import Icon from "../Icon.jsx";
import { NAV } from "./Sidebar.jsx";
import PlanSwitcher from "./PlanSwitcher.jsx";
import ThemeToggle from "./ThemeToggle.jsx";

export default function TopBar({ view, onMenu }) {
	const S = useTheme();
	const { effWR, runsOut } = usePlanner();
	// Canonical verdict — same inputs/precedence as the sidebar and dashboard
	// banner, so the badge can never contradict them.
	const { status } = computePlanHealth({ runsOut, effWR });
	const visual = healthVisual(status, S);
	const title = NAV.find((n) => n.id === view)?.label || "";

	return (
		<header className="topbar">
			<span className="menu-btn">
				<IconButton title="Menu" onClick={onMenu}>
					<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
						<path d="M3 6h18M3 12h18M3 18h18" />
					</svg>
				</IconButton>
			</span>

			<div
				className="hide-sm"
				style={{ fontSize: FS.md, fontWeight: 700, color: S.text }}
			>
				{title}
			</div>

			<div style={{ flex: 1 }} />

			<Badge color={visual.color}>
				<Icon name={visual.icon} size={14} color={visual.color} />
				<span style={{ fontWeight: 700 }}>{visual.label}</span>
				<span className="hide-sm">
					{" · "}
					{runsOut ? `Depletes @ ${runsOut.age}` : "Money lasts"}
				</span>
				{" · "}
				{effWR.toFixed(1)}% WR
			</Badge>

			<PlanSwitcher />
			<ThemeToggle />
		</header>
	);
}
