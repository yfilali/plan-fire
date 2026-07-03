import { lazy, Suspense } from "react";
import { StateProvider } from "./usePersistedState.jsx";
import { PlannerProvider } from "./state/PlannerProvider.jsx";
import LandingPage from "./components/landing/LandingPage.jsx";
import LoginScreen from "./components/auth/LoginScreen.jsx";
import ResetPasswordScreen from "./components/auth/ResetPasswordScreen.jsx";
import PrivacyPage from "./components/legal/PrivacyPage.jsx";
import TermsPage from "./components/legal/TermsPage.jsx";

// The authenticated planner shell is lazy-loaded so its heavy tree (recharts
// dashboard, planner state, etc.) stays out of the static prerender of the
// public marketing/legal/auth routes.
const AppShell = lazy(() => import("./App.jsx"));

// Dependency-free pathname router. `pathname` is passed in during the static
// prerender (no window on the server); on the client it defaults to the real
// location. ThemeProvider + AuthProvider are mounted globally (main.jsx), so
// every branch can use useTheme()/useAuth(). StateProvider + PlannerProvider
// wrap only the planner shell so public pages never load/persist planner state.
export default function Root({ pathname }) {
	const path =
		pathname ?? (typeof window !== "undefined" ? window.location.pathname : "/");

	switch (path) {
		case "/login":
			return <LoginScreen initialMode="login" />;
		case "/signup":
			return <LoginScreen initialMode="signup" />;
		case "/privacy":
			return <PrivacyPage />;
		case "/terms":
			return <TermsPage />;
		case "/reset-password":
			return <ResetPasswordScreen />;
		case "/app":
			return (
				<Suspense fallback={null}>
					<StateProvider>
						<PlannerProvider>
							<AppShell />
						</PlannerProvider>
					</StateProvider>
				</Suspense>
			);
		case "/":
		default:
			return <LandingPage />;
	}
}
