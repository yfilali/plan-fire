import { S } from "../lib/styles.js";

// Range slider with click-to-jump. Self-contained, theme via lib/styles.
export default function SliderRow({ label, value, onChange, min, max, step, format }) {
	return (
		<div style={{ marginBottom: 12 }}>
			<div
				style={{
					display: "flex",
					justifyContent: "space-between",
					marginBottom: 3,
				}}
			>
				<label style={{ fontSize: 12, color: S.textMuted }}>{label}</label>
				<span style={{ fontSize: 13, fontWeight: 600, fontFamily: S.mono }}>
					{format(value)}
				</span>
			</div>
			<input
				type="range"
				min={min}
				max={max}
				step={step}
				value={value}
				onPointerDown={(e) => {
					const rect = e.currentTarget.getBoundingClientRect();
					const pct = (e.clientX - rect.left) / rect.width;
					const newValue = Math.round((min + pct * (max - min)) / step) * step;
					onChange(
						Math.max(min, Math.min(max, parseFloat(newValue.toFixed(4)))),
					);
				}}
				onInput={(e) => onChange(Number(e.target.value))}
				onChange={(e) => onChange(Number(e.target.value))}
				style={{ width: "100%" }}
			/>
		</div>
	);
}
