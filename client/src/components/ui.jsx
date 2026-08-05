import { useEffect, useId, useRef } from "react";
import { useTheme } from "../theme/ThemeProvider.jsx";
import { btnBase, makeInput, RAD } from "../lib/styles.js";
import { fmt } from "../engine.js";

/* ── Surfaces ────────────────────────────────────────────────────────── */

export function Card({ children, style, pad = 16, className = "", lift = false }) {
	const S = useTheme();
	return (
		<div
			className={`${lift ? "lift" : ""} ${className}`.trim()}
			style={{
				background: S.card,
				borderRadius: 16,
				border: `1px solid ${S.border}`,
				boxShadow: S.shadowSm,
				padding: pad,
				...style,
			}}
		>
			{children}
		</div>
	);
}

export function CardHeader({ title, subtitle, right, icon }) {
	const S = useTheme();
	return (
		<div
			style={{
				display: "flex",
				alignItems: "flex-start",
				justifyContent: "space-between",
				gap: 12,
				marginBottom: subtitle ? 12 : 14,
			}}
		>
			<div>
				<div
					style={{
						fontSize: 14,
						fontWeight: 650,
						color: S.text,
						display: "flex",
						alignItems: "center",
						gap: 7,
					}}
				>
					{icon && <span style={{ fontSize: 15 }}>{icon}</span>}
					{title}
				</div>
				{subtitle && (
					<div style={{ fontSize: 12, color: S.textMuted, marginTop: 4, lineHeight: 1.5 }}>
						{subtitle}
					</div>
				)}
			</div>
			{right && <div style={{ flexShrink: 0 }}>{right}</div>}
		</div>
	);
}

export function SectionTitle({ children, sub, right }) {
	const S = useTheme();
	return (
		<div
			style={{
				display: "flex",
				alignItems: "flex-end",
				justifyContent: "space-between",
				gap: 12,
				marginBottom: 16,
				flexWrap: "wrap",
			}}
		>
			<div style={{ flex: "1 1 260px", minWidth: 0 }}>
				<h2 style={{ fontSize: 20, fontWeight: 700, color: S.text }}>{children}</h2>
				{sub && (
					<p style={{ fontSize: 13, color: S.textMuted, marginTop: 4 }}>{sub}</p>
				)}
			</div>
			{right && <div style={{ flexShrink: 0 }}>{right}</div>}
		</div>
	);
}

/* ── Stat card ───────────────────────────────────────────────────────── */

export function StatCard({ label, value, sub, color, accent }) {
	const S = useTheme();
	return (
		<div
			className="lift"
			style={{
				position: "relative",
				overflow: "hidden",
				padding: "14px 16px",
				background: S.card,
				borderRadius: 14,
				border: `1px solid ${S.border}`,
				boxShadow: S.shadowSm,
			}}
		>
			{accent && (
				<span
					style={{
						position: "absolute",
						left: 0,
						top: 0,
						bottom: 0,
						width: 3,
						background: accent,
						boxShadow: `0 0 12px ${accent}99`,
					}}
				/>
			)}
			<div
				style={{
					fontSize: 10.5,
					color: S.textMuted,
					marginBottom: 5,
					textTransform: "uppercase",
					letterSpacing: 0.6,
					fontWeight: 600,
				}}
			>
				{label}
			</div>
			<div
				style={{
					fontSize: 23,
					fontWeight: 750,
					color: color || S.text,
					fontFamily: S.mono,
					lineHeight: 1.1,
					letterSpacing: "-0.5px",
				}}
			>
				{value}
			</div>
			{sub && (
				<div style={{ fontSize: 11, color: S.textDim, marginTop: 4 }}>{sub}</div>
			)}
		</div>
	);
}

/* ── Buttons ─────────────────────────────────────────────────────────── */

export function Button({
	children,
	variant = "secondary",
	size = "md",
	full = false,
	style,
	...rest
}) {
	const S = useTheme();
	const sizes = {
		sm: { padding: "5px 11px", fontSize: 12, borderRadius: RAD.sm },
		md: { padding: "8px 15px", fontSize: 13, borderRadius: RAD.sm },
		lg: { padding: "11px 20px", fontSize: 14, borderRadius: RAD.sm },
	};
	const variants = {
		primary: {
			background: S.accentGradient,
			color: "#fff",
			border: `1px solid ${S.accent}`,
			fontWeight: 650,
			boxShadow: `0 1px 2px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.2)`,
		},
		secondary: { background: S.card, color: S.text, border: `1px solid ${S.border}`, fontWeight: 550, boxShadow: S.shadowSm },
		ghost: { background: "transparent", color: S.textMuted, border: "1px solid transparent", fontWeight: 550 },
		danger: { background: "transparent", color: S.danger, border: `1px solid ${S.border}`, fontWeight: 550 },
	};
	const hoverLift = (e, on) => {
		e.currentTarget.style.transform = on ? "translateY(-1px)" : "translateY(0)";
		e.currentTarget.style.filter = on ? "brightness(1.05)" : "brightness(1)";
	};
	return (
		<button
			{...rest}
			onMouseEnter={(e) => { hoverLift(e, true); rest.onMouseEnter?.(e); }}
			onMouseLeave={(e) => { hoverLift(e, false); rest.onMouseLeave?.(e); }}
			style={{
				...btnBase,
				...sizes[size],
				...variants[variant],
				width: full ? "100%" : undefined,
				display: "inline-flex",
				alignItems: "center",
				justifyContent: "center",
				gap: 7,
				whiteSpace: "nowrap",
				transition: "transform .14s ease, filter .14s ease, background .14s ease",
				...style,
			}}
		>
			{children}
		</button>
	);
}

export function IconButton({ children, title, active, style, ...rest }) {
	const S = useTheme();
	return (
		<button
			{...rest}
			title={title}
			aria-label={title}
			style={{
				...btnBase,
				width: 36,
				height: 36,
				borderRadius: RAD.sm,
				display: "inline-flex",
				alignItems: "center",
				justifyContent: "center",
				background: active ? S.cardHover : "transparent",
				border: `1px solid ${active ? S.borderStrong : S.border}`,
				color: S.textMuted,
				fontSize: 15,
				...style,
			}}
		>
			{children}
		</button>
	);
}

/* ── Chips & segmented ───────────────────────────────────────────────── */

export function Chip({ active, onClick, children, color }) {
	const S = useTheme();
	const c = color || S.accent;
	return (
		<button
			type="button"
			onClick={onClick}
			aria-pressed={!!active}
			style={{
				...btnBase,
				padding: "5px 13px",
				borderRadius: RAD.pill,
				border: `1.5px solid ${active ? c : S.border}`,
				background: active ? c + "1e" : "transparent",
				color: active ? c : S.textMuted,
				fontSize: 12,
				fontWeight: 550,
			}}
		>
			{children}
		</button>
	);
}

export function Segmented({ options, value, onChange, size = "md" }) {
	const S = useTheme();
	const pad = size === "sm" ? "4px 10px" : "6px 13px";
	const fs = size === "sm" ? 11 : 12.5;
	return (
		<div
			role="radiogroup"
			style={{
				display: "inline-flex",
				padding: 3,
				gap: 2,
				background: S.bg,
				border: `1px solid ${S.border}`,
				borderRadius: RAD.sm,
			}}
		>
			{options.map((o) => {
				const on = value === o.value;
				return (
					<button
						key={String(o.value)}
						type="button"
						role="radio"
						aria-checked={on}
						onClick={() => onChange(o.value)}
						style={{
							...btnBase,
							padding: pad,
							fontSize: fs,
							fontWeight: on ? 650 : 500,
							borderRadius: 7,
							background: on ? S.card : "transparent",
							color: on ? (o.color || S.text) : S.textMuted,
							boxShadow: on ? "0 1px 2px rgba(0,0,0,0.12)" : "none",
						}}
					>
						{o.label}
					</button>
				);
			})}
		</div>
	);
}

export function Badge({ children, color, tone = "soft" }) {
	const S = useTheme();
	const c = color || S.textMuted;
	const styles =
		tone === "soft"
			? { background: c + "1e", color: c, border: `1px solid ${c}44` }
			: { background: "transparent", color: c, border: `1px solid ${c}66` };
	return (
		<span
			style={{
				display: "inline-flex",
				alignItems: "center",
				gap: 5,
				padding: "3px 9px",
				borderRadius: 20,
				fontSize: 11,
				fontWeight: 600,
				lineHeight: 1.4,
				...styles,
			}}
		>
			{children}
		</span>
	);
}

export function Tag({ children, color }) {
	const S = useTheme();
	const c = color || S.textMuted;
	return (
		<span
			style={{
				display: "inline-block",
				padding: "1px 7px",
				borderRadius: 6,
				fontSize: 10,
				fontWeight: 600,
				color: c,
				background: c + "18",
				border: `1px solid ${c}40`,
				verticalAlign: "middle",
				lineHeight: "16px",
			}}
		>
			{children}
		</span>
	);
}

/* ── Inputs ──────────────────────────────────────────────────────────── */

export function Field({ label, hint, children, style }) {
	const S = useTheme();
	return (
		<label style={{ display: "block", ...style }}>
			{label && (
				<div style={{ fontSize: 11.5, color: S.textMuted, marginBottom: 5, fontWeight: 550 }}>
					{label}
				</div>
			)}
			{children}
			{hint && (
				<div style={{ fontSize: 10.5, color: S.textDim, marginTop: 4 }}>{hint}</div>
			)}
		</label>
	);
}

export function TextInput({ style, ...rest }) {
	const S = useTheme();
	return (
		<input {...rest} style={{ ...makeInput(S), padding: "8px 11px", width: "100%", ...style }} />
	);
}

export function Select({ style, children, ...rest }) {
	const S = useTheme();
	return (
		<select {...rest} style={{ ...makeInput(S), padding: "8px 11px", cursor: "pointer", ...style }}>
			{children}
		</select>
	);
}

/* ── Modal ───────────────────────────────────────────────────────────── */

const FOCUSABLE_SELECTOR =
	'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

// Modals can stack (e.g. a ConfirmDialog opened from within another modal).
// Only the top-most one should react to Escape/Tab, so each mounted Modal
// registers itself here and checks it's still on top before acting.
let modalStack = [];

export function Modal({ title, onClose, children, width = 520, footer }) {
	const S = useTheme();
	const panelRef = useRef(null);
	const titleId = useId();
	// Keep the handler closing over the *latest* onClose without re-running
	// the mount effect every render (call sites typically pass a fresh arrow
	// function each time, which would otherwise re-grab focus repeatedly).
	const onCloseRef = useRef(onClose);
	onCloseRef.current = onClose;

	useEffect(() => {
		const id = {};
		modalStack.push(id);
		const previouslyFocused = document.activeElement;

		// Don't steal focus from a field that already claimed it via autoFocus.
		if (panelRef.current && !panelRef.current.contains(document.activeElement)) {
			panelRef.current.focus();
		}

		const onKeyDown = (e) => {
			if (modalStack[modalStack.length - 1] !== id) return; // not the top-most modal
			if (e.key === "Escape") {
				onCloseRef.current();
				return;
			}
			if (e.key !== "Tab" || !panelRef.current) return;
			const els = panelRef.current.querySelectorAll(FOCUSABLE_SELECTOR);
			if (!els.length) return;
			const first = els[0];
			const last = els[els.length - 1];
			if (e.shiftKey && document.activeElement === first) {
				e.preventDefault();
				last.focus();
			} else if (!e.shiftKey && document.activeElement === last) {
				e.preventDefault();
				first.focus();
			}
		};

		document.addEventListener("keydown", onKeyDown);
		return () => {
			document.removeEventListener("keydown", onKeyDown);
			modalStack = modalStack.filter((x) => x !== id);
			// Return focus to whatever opened the modal (a button, usually).
			if (previouslyFocused instanceof HTMLElement) previouslyFocused.focus();
		};
	}, []);

	return (
		<div
			onClick={onClose}
			className="modal-scrim"
			style={{
				position: "fixed",
				inset: 0,
				background: "rgba(5,7,12,0.62)",
				backdropFilter: "blur(6px)",
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				zIndex: 100,
				padding: 16,
			}}
		>
			<div
				ref={panelRef}
				onClick={(e) => e.stopPropagation()}
				className="modal-pop"
				role="dialog"
				aria-modal="true"
				aria-labelledby={titleId}
				tabIndex={-1}
				style={{
					background: S.surface,
					borderRadius: 18,
					border: `1px solid ${S.borderStrong}`,
					boxShadow: S.shadowLg,
					width,
					maxWidth: "100%",
					maxHeight: "85vh",
					display: "flex",
					flexDirection: "column",
					outline: "none",
				}}
			>
				<div
					style={{
						display: "flex",
						justifyContent: "space-between",
						alignItems: "center",
						padding: "18px 22px",
						borderBottom: `1px solid ${S.border}`,
					}}
				>
					<h3 id={titleId} style={{ fontSize: 17, fontWeight: 700, color: S.text }}>{title}</h3>
					<IconButton title="Close" onClick={onClose}>
						✕
					</IconButton>
				</div>
				<div style={{ padding: 22, overflowY: "auto" }}>{children}</div>
				{footer && (
					<div
						style={{
							padding: "14px 22px",
							borderTop: `1px solid ${S.border}`,
							display: "flex",
							justifyContent: "flex-end",
							gap: 8,
						}}
					>
						{footer}
					</div>
				)}
			</div>
		</div>
	);
}

/* ── Confirm dialog ──────────────────────────────────────────────────── */

// Shared replacement for native confirm() on every destructive action —
// gets Escape-to-cancel, scrim-click-to-cancel, and focus trapping for free
// by building on Modal. `danger` controls whether the confirm button reads
// as destructive (red) or a plain affirmative action.
export function ConfirmDialog({
	title = "Are you sure?",
	message,
	children,
	confirmLabel = "Confirm",
	cancelLabel = "Cancel",
	danger = true,
	onConfirm,
	onCancel,
}) {
	const S = useTheme();
	return (
		<Modal
			title={title}
			width={440}
			onClose={onCancel}
			footer={
				<>
					<Button variant="ghost" onClick={onCancel}>
						{cancelLabel}
					</Button>
					<Button variant={danger ? "danger" : "primary"} onClick={onConfirm}>
						{confirmLabel}
					</Button>
				</>
			}
		>
			{message && (
				<p style={{ fontSize: 13, color: S.textMuted, lineHeight: 1.55, margin: 0 }}>
					{message}
				</p>
			)}
			{children}
		</Modal>
	);
}

// Shared copy for plan deletion so the card ✕ (PlanView) and the switcher's
// "Delete current" (PlanSwitcher) can't drift into two different messages —
// see UX review M3/M4.
export const planDeleteMessage = (name) =>
	`Delete plan "${name}"? Expenses and assets tagged to it will revert to All plans.`;

/* ── Recharts tooltip ────────────────────────────────────────────────── */

export function ChartTip({ active, payload, label, formatter = fmt }) {
	const S = useTheme();
	if (!active || !payload?.length) return null;
	return (
		<div
			style={{
				background: S.surface,
				border: `1px solid ${S.borderStrong}`,
				borderRadius: 10,
				padding: "10px 13px",
				boxShadow: S.shadow,
			}}
		>
			<p style={{ fontWeight: 650, marginBottom: 6, color: S.text, fontSize: 12.5 }}>
				Age {label}
			</p>
			{payload.map((p, i) => (
				<p
					key={i}
					style={{
						color: p.color,
						margin: "3px 0",
						fontSize: 12,
						display: "flex",
						justifyContent: "space-between",
						gap: 14,
					}}
				>
					<span>{p.name}</span>
					<span style={{ fontFamily: S.mono, fontWeight: 600 }}>
						{typeof p.value === "number" ? formatter(p.value) : p.value}
					</span>
				</p>
			))}
		</div>
	);
}
