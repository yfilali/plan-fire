import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import "./theme/theme.css";
import { ThemeProvider } from "./theme/ThemeProvider.jsx";
import { AuthProvider } from "./state/AuthProvider.jsx";
import Root from "./Root.jsx";

// Speed Insights is optional telemetry, not app functionality: it must never
// be able to break the page. Loaded via dynamic import behind a .catch() so
// a missing/unresolvable package or a failed chunk fetch just no-ops instead
// of throwing. The component's own script tag already fails soft (onerror ->
// console.log, not a throw) when va.vercel-scripts.com is unreachable — see
// docs/UX_REVIEW.md M1 — this adds the same guarantee around the import step.
function LazySpeedInsights() {
	const [Comp, setComp] = useState(null);
	useEffect(() => {
		let cancelled = false;
		import("@vercel/speed-insights/react")
			.then((mod) => {
				if (!cancelled) setComp(() => mod.SpeedInsights);
			})
			.catch(() => {
				// Analytics unavailable (blocked, offline, or not installed) is not
				// an app error — render nothing and move on.
			});
		return () => {
			cancelled = true;
		};
	}, []);
	return Comp ? <Comp /> : null;
}

// ThemeProvider + AuthProvider are global so the landing, auth, and legal
// pages can use useTheme()/useAuth(). StateProvider + PlannerProvider are
// mounted inside Root's "/app" branch only, so marketing/auth/legal pages
// never load or persist planner state.
ReactDOM.createRoot(document.getElementById("root")).render(
	<React.StrictMode>
		<ThemeProvider>
			<AuthProvider>
				<Root />
				<LazySpeedInsights />
			</AuthProvider>
		</ThemeProvider>
	</React.StrictMode>,
);
