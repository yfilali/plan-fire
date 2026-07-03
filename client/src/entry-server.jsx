import { StrictMode } from "react";
import { renderToString } from "react-dom/server";
import { ThemeProvider } from "./theme/ThemeProvider.jsx";
import { AuthProvider } from "./state/AuthProvider.jsx";
import Root from "./Root.jsx";

// Renders a public route to an HTML string for build-time prerendering.
// Effects don't run during renderToString, so this produces the logged-out,
// client-theme-default marketing HTML — real content for crawlers. The client
// then re-renders on load (see main.jsx), so there is no hydration to match.
export function render(pathname) {
	return renderToString(
		<StrictMode>
			<ThemeProvider>
				<AuthProvider>
					<Root pathname={pathname} />
				</AuthProvider>
			</ThemeProvider>
		</StrictMode>,
	);
}
