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
import OnboardingWizard from "./components/onboarding/OnboardingWizard.jsx";

const VIEWS = {
	dashboard: DashboardView,
	copilot: CopilotView,
	expenses: ExpensesView,
	assets: AssetsView,
	markets: MarketView,
	plan: PlanView,
	settings: SettingsView,
};

import { GUEST_CONTINUE_KEY } from "./lib/guest.js";

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

// The authenticated planner shell, rendered by Root at "/app" wrapped in
// StateProvider + PlannerProvider. Assumes those providers are present.
export default function AppShell() {
	const S = useTheme();
	const { loaded } = useStoreStatus();
	const { ready, showOnboarding } = usePlanner();
	const { loading: authLoading, user } = useAuth();
	const [view, setView] = usePersistedState("view", "dashboard");
	const [navOpen, setNavOpen] = useState(false);
	const [justVerified, setJustVerified] = useState(false);
	const guestContinued = (() => {
		try {
			return localStorage.getItem(GUEST_CONTINUE_KEY) === "1";
		} catch {
			return false;
		}
	})();

	// Close the mobile drawer automatically once we're back at desktop width,
	// so a stale "open" state can't leave the sidebar stuck.
	useEffect(() => {
		if (!window.matchMedia) return;
		const mq = window.matchMedia("(min-width: 861px)");
		const onChange = (e) => e.matches && setNavOpen(false);
		mq.addEventListener?.("change", onChange);
		return () => mq.removeEventListener?.("change", onChange);
	}, []);

	// A visitor who is neither authenticated nor continuing as a guest has no
	// business on "/app" — send them to the login screen. Done in an effect so
	// we don't navigate during render.
	useEffect(() => {
		if (!authLoading && !user && !guestContinued) {
			window.location.href = "/login";
		}
	}, [authLoading, user, guestContinued]);

	// The emailed verification link lands here as "/app?verified=1" (Better
	// Auth signs the user in first). Show a one-time banner, then drop the
	// query param so a refresh/share of the URL doesn't repeat it.
	useEffect(() => {
		const params = new URLSearchParams(window.location.search);
		if (params.get("verified") !== "1") return;
		setJustVerified(true);
		params.delete("verified");
		const query = params.toString();
		window.history.replaceState({}, "", `/app${query ? `?${query}` : ""}`);
	}, []);

	if (authLoading) return <Loader label="Signing you in…" />;
	// While the redirect above is in flight, render a spinner rather than the
	// (unauthorized) planner.
	if (!user && !guestContinued) return <Loader label="Redirecting…" />;
	if (!loaded) return <Loader label="Loading your plan…" />;
	if (!ready) return <Loader label="Preparing plans…" />;

	// Shown above either branch below — onboarding or the main shell — so a
	// brand-new signup that lands straight in onboarding still sees it.
	const verifiedBanner = justVerified && (
		<div
			role="status"
			style={{
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				gap: 10,
				padding: "10px 16px",
				background: S.accent,
				color: S.onAccent || "#fff",
				fontSize: 13,
				fontWeight: 600,
			}}
		>
			Email verified — you're all set.
			<button
				type="button"
				onClick={() => setJustVerified(false)}
				aria-label="Dismiss"
				style={{ background: "none", border: "none", color: "inherit", fontSize: 15, cursor: "pointer", lineHeight: 1, opacity: 0.85 }}
			>
				×
			</button>
		</div>
	);

	if (showOnboarding)
		return (
			<>
				{verifiedBanner}
				<OnboardingWizard />
			</>
		);

	const View = VIEWS[view] || DashboardView;

	return (
		<>
			{verifiedBanner}
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
		</>
	);
}
