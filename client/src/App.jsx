import { useState, useEffect } from "react";
import { useTheme } from "./theme/ThemeProvider.jsx";
import { usePersistedState, useStoreStatus } from "./usePersistedState.jsx";
import { usePlanner } from "./state/PlannerProvider.jsx";
import { useAuth } from "./state/AuthProvider.jsx";
import Sidebar from "./components/shell/Sidebar.jsx";
import TopBar from "./components/shell/TopBar.jsx";
import DashboardView from "./views/DashboardView.jsx";
import ExpensesView from "./views/ExpensesView.jsx";
import AssetsView from "./views/AssetsView.jsx";
import MarketView from "./views/MarketView.jsx";
import PlanView from "./views/PlanView.jsx";
import SettingsView from "./views/SettingsView.jsx";
import CopilotView from "./views/CopilotView.jsx";
import LoginScreen from "./components/auth/LoginScreen.jsx";
import ResetPasswordScreen from "./components/auth/ResetPasswordScreen.jsx";

const VIEWS = {
	dashboard: DashboardView,
	copilot: CopilotView,
	expenses: ExpensesView,
	assets: AssetsView,
	markets: MarketView,
	plan: PlanView,
	settings: SettingsView,
};

// Remember a guest who chose to continue without an account, so the login
// screen doesn't reappear on every reload.
const GUEST_CONTINUE_KEY = "firly_guest_continue";

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
	const { loading: authLoading, user } = useAuth();
	const [view, setView] = usePersistedState("view", "dashboard");
	const [navOpen, setNavOpen] = useState(false);
	const [guestContinued, setGuestContinued] = useState(() => {
		try {
			return localStorage.getItem(GUEST_CONTINUE_KEY) === "1";
		} catch {
			return false;
		}
	});

	const continueAsGuest = () => {
		try {
			localStorage.setItem(GUEST_CONTINUE_KEY, "1");
		} catch {
			// ignore storage failures — session-only guest is fine
		}
		setGuestContinued(true);
	};

	// Close the mobile drawer automatically once we're back at desktop width,
	// so a stale "open" state can't leave the sidebar stuck.
	useEffect(() => {
		if (!window.matchMedia) return;
		const mq = window.matchMedia("(min-width: 861px)");
		const onChange = (e) => e.matches && setNavOpen(false);
		mq.addEventListener?.("change", onChange);
		return () => mq.removeEventListener?.("change", onChange);
	}, []);

	// Password-reset landing page (from the emailed link) — shown regardless of
	// auth state, before anything else.
	if (window.location.pathname === "/reset-password")
		return <ResetPasswordScreen />;

	if (authLoading) return <Loader label="Signing you in…" />;
	// Show the login screen until the visitor either signs in or chooses to
	// continue as a guest. LoginScreen can be dismissed to guest via onGuest.
	if (!user && !guestContinued) return <LoginScreen onGuest={continueAsGuest} />;
	if (!loaded) return <Loader label="Loading your plan…" />;
	if (!ready) return <Loader label="Preparing plans…" />;

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
				<TopBar view={view} onMenu={() => setNavOpen((o) => !o)} />
				<div className="content">
					<div className="content-inner">
						<View />
					</div>
				</div>
			</div>
		</div>
	);
}
