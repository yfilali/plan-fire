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

// Type scale (px). Collapses the app's ad-hoc font sizes
// (10.5/11.5/12.5/13.5/14/15/18/23) onto a fixed ladder so callers can swap
// e.g. fontSize:12.5 -> FS.sm. `base` (13) is the default body size used by
// makeInput; `md` (14) is the common label/body-emphasis size.
export const FS = { xs: 11, sm: 12, base: 13, md: 14, lg: 16, xl: 20, xxl: 24 };

// Border-radius scale (px). Replaces ad-hoc radii (8/9/10/12/14/16/18/20).
// `sm` (8) matches makeInput; `lg` (16) is the card surface; `pill` for chips.
export const RAD = { sm: 8, md: 12, lg: 16, pill: 999 };

// Font-weight scale for consistent emphasis steps.
export const FW = { normal: 400, medium: 500, semibold: 600, bold: 700 };
