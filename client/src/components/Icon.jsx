// Themeable inline-SVG icon set. Replaces the functional emoji scattered
// through the app with crisp, currentColor-driven glyphs. The drawing style
// matches the sidebar nav icons (24×24 viewBox, stroke-only, round caps).
//
//   <Icon name="check" />            // 16px, inherits text color
//   <Icon name="shield" size={20} color={S.accent} />
//
// Unknown names render nothing (a no-op) so a typo never throws.

// Each entry is the inner path markup for a 24×24, stroke="currentColor" SVG.
const PATHS = {
	check: <path d="M20 6 9 17l-5-5" />,
	// circular exclamation — soft "heads up"
	alert: (
		<>
			<circle cx="12" cy="12" r="9" />
			<path d="M12 8v4M12 16h.01" />
		</>
	),
	// triangular exclamation — stronger "warning"
	warning: (
		<>
			<path d="M10.3 3.6 1.8 18a2 2 0 0 0 1.7 3h16.9a2 2 0 0 0 1.7-3L13.7 3.6a2 2 0 0 0-3.4 0z" />
			<path d="M12 9v4M12 17h.01" />
		</>
	),
	"x-circle": (
		<>
			<circle cx="12" cy="12" r="9" />
			<path d="M15 9l-6 6M9 9l6 6" />
		</>
	),
	// milestone / finish-line flag
	flag: (
		<>
			<path d="M5 22V4" />
			<path d="M5 4h12l-2.5 4L17 12H5" />
		</>
	),
	// retirement — party popper / celebrate
	retire: (
		<>
			<path d="M3 21l4.4-9.6 5.2 5.2z" />
			<path d="M11 9l1.4-1.4M13.5 12l2-.5M14 3v3M19 5l-2 2M21 10h-3" />
		</>
	),
	// Medicare / health — rounded medical cross
	medical: (
		<>
			<rect x="3.5" y="3.5" width="17" height="17" rx="4" />
			<path d="M12 8v8M8 12h8" />
		</>
	),
	// Social Security / cash benefit — dollar
	"social-security": (
		<>
			<line x1="12" y1="2" x2="12" y2="22" />
			<path d="M17 6H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
		</>
	),
	// 401k / employer plan — briefcase
	briefcase: (
		<>
			<rect x="3" y="7" width="18" height="13" rx="2" />
			<path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 13h18" />
		</>
	),
	// relocation / moving — box truck
	relocate: (
		<>
			<path d="M2 4h12v11H2zM14 8h4l3 3.5V15h-7z" />
			<circle cx="6.5" cy="18" r="1.8" />
			<circle cx="16.5" cy="18" r="1.8" />
		</>
	),
	mail: (
		<>
			<rect x="2.5" y="4.5" width="19" height="15" rx="2.5" />
			<path d="m3 7 9 6 9-6" />
		</>
	),
	plane: (
		<path d="M21 15.5v-2l-8-5V3.6a1.6 1.6 0 0 0-3.2 0V8.5l-8 5v2l8-2.4v4.4l-2.2 1.5V21l3.8-1.1L13.2 21v-1.5L11 18V13z" />
	),
	shield: (
		<path d="M12 2.5 4.5 5.3v5.5c0 4.8 3.3 7.8 7.5 10.7 4.2-2.9 7.5-5.9 7.5-10.7V5.3z" />
	),
	// AI / co-pilot — sparkle with a small companion star
	sparkle: (
		<>
			<path d="M11 3.5 12.7 8 17 9.5 12.7 11 11 15.5 9.3 11 5 9.5 9.3 8z" />
			<path d="M18.5 14v3M20 15.5h-3" />
		</>
	),
};

export default function Icon({ name, size = 16, color, style, ...rest }) {
	const inner = PATHS[name];
	if (!inner) return null; // unknown glyph -> nothing, never throws
	return (
		<svg
			width={size}
			height={size}
			viewBox="0 0 24 24"
			fill="none"
			stroke={color || "currentColor"}
			strokeWidth="1.9"
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden="true"
			focusable="false"
			style={{ display: "block", flexShrink: 0, ...style }}
			{...rest}
		>
			{inner}
		</svg>
	);
}

// Exposed so callers can guard or enumerate available glyphs if needed.
export const ICON_NAMES = Object.keys(PATHS);
