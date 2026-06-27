import React from "react";
import ReactDOM from "react-dom/client";
import "./theme/theme.css";
import { StateProvider } from "./usePersistedState.jsx";
import { ThemeProvider } from "./theme/ThemeProvider.jsx";
import { PlannerProvider } from "./state/PlannerProvider.jsx";
import { AuthProvider } from "./state/AuthProvider.jsx";
import App from "./App.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
	<React.StrictMode>
		<AuthProvider>
			<StateProvider>
				<ThemeProvider>
					<PlannerProvider>
						<App />
					</PlannerProvider>
				</ThemeProvider>
			</StateProvider>
		</AuthProvider>
	</React.StrictMode>,
);
