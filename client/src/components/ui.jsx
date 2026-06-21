import { useTheme } from "../theme/ThemeProvider.jsx";
import { btnBase, makeInput } from "../lib/styles.js";
import { fmt } from "../engine.js";

/* ── Surfaces ────────────────────────────────────────────────────────── */

export function Card({ children, style, pad = 16, className = "" }) {
	const S = useTheme();
	return (
		<div
			className={className}
			style={{
				background: S.card,
				borderRadius: 14,
				border: `1px solid ${S.border}`,
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
			<div>
				<h2 style={{ fontSize: 20, fontWeight: 700, color: S.text }}>{children}</h2>
				{sub && (
					<p style={{ fontSize: 13, color: S.textMuted, marginTop: 4 }}>{sub}</p>
				)}
			</div>
			{right}
		</div>
	);
}

/* ── Stat card ───────────────────────────────────────────────────────── */

export function StatCard({ label, value, sub, color, accent }) {
	const S = useTheme();
	return (
		<div
			style={{
				padding: "13px 15px",
				background: S.card,
				borderRadius: 12,
				border: `1px solid ${S.border}`,
				borderLeft: accent ? `3px solid ${accent}` : `1px solid ${S.border}`,
			}}
		>
			<div
				style={{
					fontSize: 10.5,
					color: S.textMuted,
					marginBottom: 4,
					textTransform: "uppercase",
					letterSpacing: 0.6,
					fontWeight: 600,
				}}
			>
				{label}
			</div>
			<div
				style={{
					fontSize: 22,
					fontWeight: 750,
					color: color || S.text,
					fontFamily: S.mono,
					lineHeight: 1.1,
				}}
			>
				{value}
			</div>
			{sub && (
				<div style={{ fontSize: 11, color: S.textDim, marginTop: 3 }}>{sub}</div>
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
		sm: { padding: "5px 11px", fontSize: 12, borderRadius: 8 },
		md: { padding: "8px 15px", fontSize: 13, borderRadius: 9 },
		lg: { padding: "11px 20px", fontSize: 14, borderRadius: 10 },
	};
	const variants = {
		primary: { background: S.accent, color: "#fff", border: `1px solid ${S.accent}`, fontWeight: 650 },
		secondary: { background: S.card, color: S.text, border: `1px solid ${S.border}`, fontWeight: 550 },
		ghost: { background: "transparent", color: S.textMuted, border: "1px solid transparent", fontWeight: 550 },
		danger: { background: "transparent", color: S.danger, border: `1px solid ${S.border}`, fontWeight: 550 },
	};
	return (
		<button
			{...rest}
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
				borderRadius: 9,
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
			onClick={onClick}
			style={{
				...btnBase,
				padding: "5px 13px",
				borderRadius: 20,
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
			style={{
				display: "inline-flex",
				padding: 3,
				gap: 2,
				background: S.bg,
				border: `1px solid ${S.border}`,
				borderRadius: 10,
			}}
		>
			{options.map((o) => {
				const on = value === o.value;
				return (
					<button
						key={String(o.value)}
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

export function Modal({ title, onClose, children, width = 520, footer }) {
	const S = useTheme();
	return (
		<div
			onClick={onClose}
			style={{
				position: "fixed",
				inset: 0,
				background: "rgba(0,0,0,0.55)",
				backdropFilter: "blur(2px)",
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				zIndex: 100,
				padding: 16,
			}}
		>
			<div
				onClick={(e) => e.stopPropagation()}
				className="fade-in"
				style={{
					background: S.surface,
					borderRadius: 16,
					border: `1px solid ${S.border}`,
					boxShadow: S.shadow,
					width,
					maxWidth: "100%",
					maxHeight: "85vh",
					display: "flex",
					flexDirection: "column",
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
					<h3 style={{ fontSize: 17, fontWeight: 700, color: S.text }}>{title}</h3>
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
