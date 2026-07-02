import { StateProvider } from "./usePersistedState.jsx";
import { PlannerProvider } from "./state/PlannerProvider.jsx";
import AppShell from "./App.jsx";
import LandingPage from "./components/landing/LandingPage.jsx";
import LoginScreen from "./components/auth/LoginScreen.jsx";
import ResetPasswordScreen from "./components/auth/ResetPasswordScreen.jsx";
import PrivacyPage from "./components/legal/PrivacyPage.jsx";
import TermsPage from "./components/legal/TermsPage.jsx";

// Dependency-free pathname router. ThemeProvider + AuthProvider are mounted
// globally (in main.jsx), so every branch below can use useTheme()/useAuth().
// StateProvider + PlannerProvider are mounted ONLY around the planner shell so
// that visiting marketing/auth/legal pages never triggers /api/state loads or
// creates guest rows.
export default function Root() {
	const path = window.location.pathname;

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
				<StateProvider>
					<PlannerProvider>
						<AppShell />
					</PlannerProvider>
				</StateProvider>
			);
		case "/":
		default:
			return <LandingPage />;
	}
}
