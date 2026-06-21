// Shared base control styles. Color comes from the active theme palette
// (see theme/ThemeProvider). Components call `useTheme()` to get `S`, then
// build inputs with `makeInput(S)`. `btnBase` is color-free (font + reset)
// so it can stay a static constant.
import { DARK } from "../theme/ThemeProvider.jsx";

// Default palette for any non-React/legacy import sites.
export const S = DARK;

export const btnBase = {
	border: "none",
	cursor: "pointer",
	fontFamily: DARK.font,
	transition: "all .15s ease",
};

// Theme-aware text input / select base.
export const makeInput = (S) => ({
	borderRadius: 8,
	border: `1px solid ${S.border}`,
	background: S.bg,
	color: S.text,
	fontSize: 13,
	fontFamily: S.font,
	outline: "none",
});

// Reusable card surface.
export const makeCard = (S, { pad = 16, hover = false } = {}) => ({
	background: S.card,
	borderRadius: 14,
	border: `1px solid ${S.border}`,
	padding: pad,
	...(hover ? { transition: "border-color .15s ease" } : {}),
});

// Spacing scale (px) for consistent rhythm.
export const SP = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 };
