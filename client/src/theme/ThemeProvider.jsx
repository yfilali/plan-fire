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
	bg: "#0a0c11",
	bgElev: "#0e1118",
	surface: "#13161e",
	card: "#181c26",
	cardHover: "#1f2431",
	border: "#242a37",
	borderStrong: "#333a4b",
	text: "#eceef4",
	textMuted: "#969db0",
	textDim: "#646b7d",
	accent: "#22c55e",
	accentHover: "#16a34a",
	accent2: "#0fb5a0",
	accentGradient: "linear-gradient(135deg,#34d399 0%,#10b981 55%,#0ea5a4 100%)",
	accentSoft: "rgba(34,197,94,0.13)",
	warning: "#f59e0b",
	danger: "#ef4444",
	blue: "#3b82f6",
	purple: "#8b5cf6",
	ring: "rgba(34,197,94,0.45)",
	shadow: "0 6px 24px rgba(0,0,0,0.35)",
	shadowSm: "0 1px 2px rgba(0,0,0,0.4), 0 1px 3px rgba(0,0,0,0.25)",
	shadowMd: "0 4px 14px rgba(0,0,0,0.4)",
	shadowLg: "0 18px 50px -12px rgba(0,0,0,0.65)",
	glow: "0 0 0 1px rgba(34,197,94,0.18), 0 8px 30px -8px rgba(16,185,129,0.35)",
	appBg:
		"radial-gradient(1200px 600px at 78% -8%, rgba(16,185,129,0.07), transparent 60%), radial-gradient(900px 520px at -6% 8%, rgba(59,130,246,0.06), transparent 55%), #0a0c11",
};

export const LIGHT = {
	...SHARED,
	scheme: "light",
	bg: "#f4f6f9",
	bgElev: "#ffffff",
	surface: "#ffffff",
	card: "#ffffff",
	cardHover: "#f5f7fa",
	border: "#e8ebf1",
	borderStrong: "#d4dae3",
	text: "#11151f",
	textMuted: "#5a6475",
	textDim: "#95a0b0",
	accent: "#0f9d58",
	accentHover: "#0c7e46",
	accent2: "#0d9488",
	accentGradient: "linear-gradient(135deg,#16c47f 0%,#0fa372 55%,#0d9488 100%)",
	accentSoft: "rgba(15,157,88,0.10)",
	warning: "#d97706",
	danger: "#dc2626",
	blue: "#2563eb",
	purple: "#7c3aed",
	ring: "rgba(15,157,88,0.30)",
	shadow: "0 6px 20px rgba(16,24,40,0.10)",
	shadowSm: "0 1px 2px rgba(16,24,40,0.06), 0 1px 3px rgba(16,24,40,0.05)",
	shadowMd: "0 4px 16px rgba(16,24,40,0.10)",
	shadowLg: "0 22px 48px -16px rgba(16,24,40,0.22)",
	glow: "0 0 0 1px rgba(15,157,88,0.16), 0 10px 30px -10px rgba(15,157,88,0.22)",
	appBg:
		"radial-gradient(1100px 560px at 80% -10%, rgba(15,157,88,0.06), transparent 60%), radial-gradient(800px 480px at -8% 6%, rgba(37,99,235,0.05), transparent 55%), #f4f6f9",
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
