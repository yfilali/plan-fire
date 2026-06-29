// Accessible inline glossary affordance. Renders a small circled "i" button
// (NOT a div, so it's natively focusable + announced) that reveals a concise
// definition on hover AND keyboard focus. Esc or blur closes it.
//
//   <InfoTip term="WR" />              // looks the definition up in GLOSSARY
//   <InfoTip text="Custom note…" />    // uses literal text
//
// Dependency-free: the popover is an absolutely-positioned element anchored to
// the wrapper span.
import { useId, useRef, useState } from "react";
import { useTheme } from "../theme/ThemeProvider.jsx";

// Concise, plain-language definitions for the jargon the app surfaces.
export const GLOSSARY = {
	WR: "Withdrawal rate — the share of your portfolio you spend in a year. A lower rate makes your savings last longer.",
	"4% rule":
		"A rule of thumb: withdraw 4% of your starting portfolio in year one, then adjust that amount for inflation each year. Historically this lasted ~30 years.",
	"sequence risk":
		"Sequence-of-returns risk — the danger that poor market returns early in retirement permanently shrink a portfolio you're already drawing down.",
	regime:
		"A market regime — a sustained environment of returns, inflation and interest rates (e.g. boom, stagflation) used to stress-test your plan.",
	"real vs nominal dollars":
		"Real dollars are inflation-adjusted (today's buying power); nominal dollars are the raw future amounts before inflation is removed.",
	"post-transition":
		"Post-transition — your finances after a planned life change (retiring, relocating, claiming benefits) has fully taken effect.",
};

export default function InfoTip({
	term,
	text,
	label,
	size = 14,
	style,
}) {
	const S = useTheme();
	const [open, setOpen] = useState(false);
	const tipId = useId();
	const closeTimer = useRef(null);

	const definition = text ?? (term ? GLOSSARY[term] : "");
	if (!definition) return null; // nothing to define -> render nothing

	const aria = label || (term ? `Definition of ${term}` : "More information");

	const show = () => {
		if (closeTimer.current) clearTimeout(closeTimer.current);
		setOpen(true);
	};
	// Small delay on mouse-out so moving toward the popover doesn't flicker it.
	const hide = (immediate = false) => {
		if (closeTimer.current) clearTimeout(closeTimer.current);
		if (immediate) return setOpen(false);
		closeTimer.current = setTimeout(() => setOpen(false), 90);
	};

	return (
		<span
			style={{
				position: "relative",
				display: "inline-flex",
				verticalAlign: "middle",
				...style,
			}}
			onMouseEnter={show}
			onMouseLeave={() => hide()}
		>
			<button
				type="button"
				aria-label={aria}
				aria-describedby={open ? tipId : undefined}
				aria-expanded={open}
				onFocus={show}
				onBlur={() => hide(true)}
				onClick={(e) => {
					e.preventDefault();
					setOpen((o) => !o);
				}}
				onKeyDown={(e) => {
					if (e.key === "Escape") hide(true);
				}}
				style={{
					all: "unset",
					cursor: "help",
					boxSizing: "border-box",
					width: size,
					height: size,
					borderRadius: "50%",
					display: "inline-flex",
					alignItems: "center",
					justifyContent: "center",
					fontFamily: S.font,
					fontSize: Math.round(size * 0.72),
					fontWeight: 700,
					fontStyle: "italic",
					lineHeight: 1,
					color: open ? S.accent : S.textMuted,
					border: `1px solid ${open ? S.accent : S.border}`,
					background: open ? S.accent + "1e" : "transparent",
					transition: "color .14s ease, border-color .14s ease, background .14s ease",
				}}
			>
				i
			</button>
			{open && (
				<span
					id={tipId}
					role="tooltip"
					style={{
						position: "absolute",
						bottom: "calc(100% + 8px)",
						left: "50%",
						transform: "translateX(-50%)",
						zIndex: 60,
						width: "max-content",
						maxWidth: 260,
						padding: "9px 12px",
						borderRadius: 10,
						background: S.surface,
						border: `1px solid ${S.borderStrong}`,
						boxShadow: S.shadow,
						color: S.text,
						fontFamily: S.font,
						fontSize: 12,
						fontWeight: 450,
						fontStyle: "normal",
						lineHeight: 1.5,
						textAlign: "left",
						whiteSpace: "normal",
						pointerEvents: "auto",
					}}
				>
					{term && !text && (
						<span
							style={{
								display: "block",
								fontWeight: 700,
								fontSize: 11.5,
								color: S.text,
								marginBottom: 3,
							}}
						>
							{term}
						</span>
					)}
					<span style={{ color: S.textMuted }}>{definition}</span>
				</span>
			)}
		</span>
	);
}

// Exposed so callers can enumerate/validate available terms.
export const GLOSSARY_TERMS = Object.keys(GLOSSARY);
