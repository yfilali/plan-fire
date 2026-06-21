import { useTheme } from "../theme/ThemeProvider.jsx";

// Labeled range slider with click-to-jump. Theme-aware via useTheme.
export default function SliderRow({ label, value, onChange, min, max, step, format }) {
	const S = useTheme();
	return (
		<div style={{ marginBottom: 14 }}>
			<div
				style={{
					display: "flex",
					justifyContent: "space-between",
					alignItems: "baseline",
					marginBottom: 6,
				}}
			>
				<label style={{ fontSize: 12.5, color: S.textMuted }}>{label}</label>
				<span style={{ fontSize: 13, fontWeight: 650, fontFamily: S.mono, color: S.text }}>
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
					onChange(Math.max(min, Math.min(max, parseFloat(newValue.toFixed(4)))));
				}}
				onInput={(e) => onChange(Number(e.target.value))}
				onChange={(e) => onChange(Number(e.target.value))}
				style={{ width: "100%" }}
			/>
		</div>
	);
}
