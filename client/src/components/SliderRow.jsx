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
					<button
						onClick={start}
						title="Click to type an exact value"
						style={{
							background: "none",
							border: "none",
							borderBottom: `1px dashed ${S.border}`,
							cursor: "text",
							fontSize: 13,
							fontWeight: 650,
							fontFamily: S.mono,
							color: beyond ? S.warning : S.text,
							padding: "0 0 1px",
						}}
					>
						{format(value)}
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
				style={{ width: "100%", opacity: beyond ? 0.6 : 1 }}
			/>
		</div>
	);
}
