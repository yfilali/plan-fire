// Shared theme + base control styles. Single source of truth for the UI.
export const S = {
	bg: "#0f1117",
	card: "#1a1d27",
	border: "#2a2d3a",
	text: "#e4e4e7",
	textMuted: "#71717a",
	textDim: "#52525b",
	accent: "#22c55e",
	warning: "#f59e0b",
	danger: "#ef4444",
	blue: "#3b82f6",
	purple: "#8b5cf6",
	font: "'DM Sans','Segoe UI',system-ui,sans-serif",
	mono: "'DM Mono','Menlo',monospace",
};

export const btnBase = {
	border: "none",
	cursor: "pointer",
	fontFamily: S.font,
	transition: "all .15s",
};

export const inputBase = {
	borderRadius: 6,
	border: `1px solid ${S.border}`,
	background: S.bg,
	color: S.text,
	fontSize: 13,
	fontFamily: S.font,
};
