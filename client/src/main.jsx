import React from "react";
import ReactDOM from "react-dom/client";
import "./theme/theme.css";
import { ThemeProvider } from "./theme/ThemeProvider.jsx";
import { AuthProvider } from "./state/AuthProvider.jsx";
import Root from "./Root.jsx";

// ThemeProvider + AuthProvider are global so the landing, auth, and legal
// pages can use useTheme()/useAuth(). StateProvider + PlannerProvider are
// mounted inside Root's "/app" branch only, so marketing/auth/legal pages
// never load or persist planner state.
ReactDOM.createRoot(document.getElementById("root")).render(
	<React.StrictMode>
		<ThemeProvider>
			<AuthProvider>
				<Root />
			</AuthProvider>
		</ThemeProvider>
	</React.StrictMode>,
);
