import { useState } from "react";
import { useTheme } from "../theme/ThemeProvider.jsx";

// Labeled range slider with click-to-jump AND click-to-type. The value label
// is editable so users can enter an exact figure — even one outside the
// slider's convenient min/max. `editScale` converts the stored unit to the
// edited unit (e.g. 100 for a fraction shown as a percent).
export default function SliderRow({
	label,
	value,
	onChange,
	min,
	max,
	step,
	format,
	editScale = 1,
	editMax,
}) {
	const S = useTheme();
	const [editing, setEditing] = useState(false);
	const [draft, setDraft] = useState("");

	const start = () => {
		setDraft(String(+(value * editScale).toFixed(4)));
		setEditing(true);
	};
	const commit = () => {
		setEditing(false);
		const raw = parseFloat(draft);
		if (Number.isNaN(raw)) return;
		let v = raw / editScale;
		if (v < min) v = min;
		if (editMax != null && v > editMax) v = editMax;
		onChange(parseFloat(v.toFixed(6)));
	};

	// The thumb can only render within [min,max]; the stored value may exceed it.
	const sliderVal = Math.min(max, Math.max(min, value));
	const beyond = value > max;
	const pct = Math.round(((sliderVal - min) / (max - min)) * 100);
	const fillColor = beyond ? S.warning : S.accent;
	const trackBg = `linear-gradient(to right, ${fillColor} 0%, ${fillColor} ${pct}%, ${S.border} ${pct}%, ${S.border} 100%)`;

	return (
		<div style={{ marginBottom: 14 }}>
			<div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
				<label style={{ fontSize: 12.5, color: S.textMuted }}>{label}</label>
				{editing ? (
					<input
						autoFocus
						type="number"
						value={draft}
						onChange={(e) => setDraft(e.target.value)}
						onBlur={commit}
						onKeyDown={(e) => {
							if (e.key === "Enter") commit();
							if (e.key === "Escape") setEditing(false);
						}}
						style={{
							width: 96,
							textAlign: "right",
							fontFamily: S.mono,
							fontSize: 13,
							fontWeight: 650,
							color: S.text,
							background: S.bg,
							border: `1px solid ${S.accent}`,
							borderRadius: 6,
							padding: "2px 7px",
							outline: "none",
						}}
					/>
				) : (
					// Boxed like a real field (not just dashed-underline text) so the
					// affordance reads as "editable" at a glance, not only on hover or
					// via the tooltip — same shape/background as the input it becomes
					// on click, just unfocused. The pencil glyph reinforces that read.
					<button
						onClick={start}
						title="Click to type an exact value"
						style={{
							display: "flex",
							alignItems: "center",
							gap: 5,
							background: S.bg,
							border: `1px solid ${S.border}`,
							borderRadius: 6,
							cursor: "text",
							fontSize: 13,
							fontWeight: 650,
							fontFamily: S.mono,
							color: beyond ? S.warning : S.text,
							padding: "2px 7px",
							transition: "border-color .14s ease",
						}}
						onMouseEnter={(e) => { e.currentTarget.style.borderColor = S.accent; }}
						onMouseLeave={(e) => { e.currentTarget.style.borderColor = S.border; }}
					>
						{format(value)}
						<svg
							width="11"
							height="11"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2.2"
							strokeLinecap="round"
							strokeLinejoin="round"
							aria-hidden="true"
							focusable="false"
							style={{ flexShrink: 0, opacity: 0.55 }}
						>
							<path d="M12 20h9" />
							<path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
						</svg>
					</button>
				)}
			</div>
			<input
				type="range"
				min={min}
				max={max}
				step={step}
				value={sliderVal}
				onPointerDown={(e) => {
					const rect = e.currentTarget.getBoundingClientRect();
					const pct = (e.clientX - rect.left) / rect.width;
					const newValue = Math.round((min + pct * (max - min)) / step) * step;
					onChange(Math.max(min, Math.min(max, parseFloat(newValue.toFixed(4)))));
				}}
				onInput={(e) => onChange(Number(e.target.value))}
				onChange={(e) => onChange(Number(e.target.value))}
				style={{ width: "100%", background: trackBg }}
			/>
		</div>
	);
}
