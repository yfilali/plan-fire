import {
	createContext,
	useContext,
	useEffect,
	useMemo,
	useState,
	useCallback,
} from "react";
import { usePersistedState } from "../usePersistedState.jsx";

/* ──────────────────────────────────────────────────────────────────────
   Color palettes. These are the single source of truth for the whole UI:
   - component internals read them via the `S` object (real hex, so the
     `S.accent + "22"` alpha-concatenation patterns keep working)
   - the base stylesheet reads them via CSS variables, which we inject onto
     <html> whenever the theme changes (see applyVars below).
   ─────────────────────────────────────────────────────────────────────── */

const SHARED = {
	font: "'DM Sans','Segoe UI',system-ui,sans-serif",
	mono: "'DM Mono','Menlo',monospace",
};

export const DARK = {
	...SHARED,
	scheme: "dark",
	bg: "#0e1015",
	surface: "#161922",
	card: "#1b1e29",
	cardHover: "#222633",
	border: "#272b38",
	borderStrong: "#363b4a",
	text: "#e7e8ee",
	textMuted: "#969cab",
	textDim: "#6a7080",
	accent: "#22c55e",
	accentHover: "#16a34a",
	warning: "#f59e0b",
	danger: "#ef4444",
	blue: "#3b82f6",
	purple: "#8b5cf6",
	shadow: "0 6px 24px rgba(0,0,0,0.35)",
};

export const LIGHT = {
	...SHARED,
	scheme: "light",
	bg: "#f5f6f8",
	surface: "#ffffff",
	card: "#ffffff",
	cardHover: "#f4f6f9",
	border: "#e6e8ee",
	borderStrong: "#d3d8e0",
	text: "#1a1d27",
	textMuted: "#5d6675",
	textDim: "#98a0ad",
	accent: "#16a34a",
	accentHover: "#15803d",
	warning: "#d97706",
	danger: "#dc2626",
	blue: "#2563eb",
	purple: "#7c3aed",
	shadow: "0 6px 20px rgba(16,24,40,0.10)",
};

const PALETTES = { dark: DARK, light: LIGHT };

const ThemeContext = createContext(null);

function systemPrefersDark() {
	return (
		typeof window !== "undefined" &&
		window.matchMedia &&
		window.matchMedia("(prefers-color-scheme: dark)").matches
	);
}

function applyVars(S) {
	if (typeof document === "undefined") return;
	const root = document.documentElement;
	Object.entries(S).forEach(([k, v]) => {
		// camelCase -> kebab-case CSS variable
		const name = "--" + k.replace(/[A-Z]/g, (m) => "-" + m.toLowerCase());
		root.style.setProperty(name, v);
	});
	root.style.colorScheme = S.scheme;
	root.setAttribute("data-theme", S.scheme);
}

export function ThemeProvider({ children }) {
	// "system" | "light" | "dark"
	const [pref, setPref] = usePersistedState("theme", "system");
	const [systemDark, setSystemDark] = useState(systemPrefersDark);

	// Track OS preference changes while in "system" mode
	useEffect(() => {
		if (!window.matchMedia) return;
		const mq = window.matchMedia("(prefers-color-scheme: dark)");
		const onChange = (e) => setSystemDark(e.matches);
		mq.addEventListener?.("change", onChange);
		return () => mq.removeEventListener?.("change", onChange);
	}, []);

	const resolved = pref === "system" ? (systemDark ? "dark" : "light") : pref;
	const S = PALETTES[resolved] || DARK;

	useEffect(() => {
		applyVars(S);
	}, [S]);

	const setTheme = useCallback((next) => setPref(next), [setPref]);
	const cycleTheme = useCallback(
		() => setPref(resolved === "dark" ? "light" : "dark"),
		[resolved, setPref],
	);

	const value = useMemo(
		() => ({ S, theme: pref, resolved, setTheme, cycleTheme }),
		[S, pref, resolved, setTheme, cycleTheme],
	);

	return (
		<ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
	);
}

/** Returns the active palette object (real hex values). */
export function useTheme() {
	const ctx = useContext(ThemeContext);
	return ctx?.S ?? DARK;
}

/** Full theme controls: { S, theme, resolved, setTheme, cycleTheme }. */
export function useThemeControls() {
	const ctx = useContext(ThemeContext);
	if (!ctx) {
		return {
			S: DARK,
			theme: "dark",
			resolved: "dark",
			setTheme: () => {},
			cycleTheme: () => {},
		};
	}
	return ctx;
}
