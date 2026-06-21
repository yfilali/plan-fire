import { useState } from "react";
import { useTheme } from "./theme/ThemeProvider.jsx";
import { usePersistedState, useStoreStatus } from "./usePersistedState.jsx";
import { usePlanner } from "./state/PlannerProvider.jsx";
import Sidebar from "./components/shell/Sidebar.jsx";
import TopBar from "./components/shell/TopBar.jsx";
import DashboardView from "./views/DashboardView.jsx";
import ExpensesView from "./views/ExpensesView.jsx";
import PlanView from "./views/PlanView.jsx";
import SettingsView from "./views/SettingsView.jsx";

const VIEWS = {
	dashboard: DashboardView,
	expenses: ExpensesView,
	plan: PlanView,
	settings: SettingsView,
};

function Loader({ label }) {
	const S = useTheme();
	return (
		<div
			style={{
				minHeight: "100vh",
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				background: S.bg,
				color: S.text,
			}}
		>
			<div style={{ textAlign: "center" }}>
				<div
					style={{
						width: 34,
						height: 34,
						margin: "0 auto 14px",
						borderRadius: "50%",
						border: `3px solid ${S.border}`,
						borderTopColor: S.accent,
						animation: "spin 0.8s linear infinite",
					}}
				/>
				<div style={{ fontSize: 14, color: S.textMuted }}>{label}</div>
			</div>
			<style>{"@keyframes spin{to{transform:rotate(360deg)}}"}</style>
		</div>
	);
}

export default function App() {
	const { loaded } = useStoreStatus();
	const { ready } = usePlanner();
	const [view, setView] = usePersistedState("view", "dashboard");
	const [navOpen, setNavOpen] = useState(false);

	if (!loaded) return <Loader label="Loading your plan…" />;
	if (!ready) return <Loader label="Preparing scenarios…" />;

	const View = VIEWS[view] || DashboardView;

	return (
		<div className="app-shell">
			<Sidebar
				view={view}
				setView={setView}
				open={navOpen}
				onClose={() => setNavOpen(false)}
			/>
			<div className="main">
				<TopBar view={view} onMenu={() => setNavOpen(true)} />
				<div className="content">
					<div className="content-inner">
						<View />
					</div>
				</div>
			</div>
		</div>
	);
}
