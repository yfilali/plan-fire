import SliderRow from "./SliderRow.jsx";

// Spending-cut controls for market downturns.
// Pure presentational — all state is owned by the parent and passed in.
const TIER_LABELS = {
	essential: { icon: "🛡️", color: "accent", note: "Never cut" },
	discretionary: { icon: "⚠️", color: "warning", fmt: (v) => `${(v * 100).toFixed(0)}% cut` },
	luxury: { icon: "💎", color: "danger", fmt: (v) => `${(v * 100).toFixed(0)}% cut` },
};

export default function DownturnCutControls({
	discretionaryCut,
	setDiscretionaryCut,
	luxuryCut,
	setLuxuryCut,
	cutMode,
	setCutMode,
	S,
	btnBase,
}) {
	const modeBtn = (val, label, activeColor) => ({
		...btnBase,
		padding: "5px 12px",
		borderRadius: 20,
		border: `1.5px solid ${cutMode === val ? activeColor : S.border}`,
		background: cutMode === val ? activeColor + "18" : "transparent",
		color: cutMode === val ? activeColor : S.textMuted,
		fontSize: 11,
		fontWeight: 500,
	});

	return (
		<div
			style={{
				background: S.card,
				borderRadius: 12,
				border: `1px solid ${S.border}`,
				padding: 18,
				marginBottom: 16,
				marginTop: 16,
			}}
		>
			<div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
				📉 Downturn Spending Controls
			</div>
			<div style={{ fontSize: 11, color: S.textMuted, marginBottom: 14 }}>
				When the market crashes, you cut spending — no brainer.
			</div>

			{/* Cut mode toggle */}
			<div
				style={{
					display: "flex",
					alignItems: "center",
					gap: 10,
					marginBottom: 14,
				}}
			>
				<span style={{ fontSize: 11, color: S.textMuted, fontWeight: 600 }}>
					Apply cuts:
				</span>
				<button
					onClick={() => setCutMode("down_recovery")}
					style={modeBtn("down_recovery", "During downturn + recovery", S.blue)}
				>
					During downturn + recovery
				</button>
				<button
					onClick={() => setCutMode("all")}
					style={modeBtn("all", "All years", S.accent)}
				>
					All years
				</button>
			</div>

			<SliderRow
				label="Discretionary Cut"
				value={discretionaryCut}
				onChange={setDiscretionaryCut}
				min={0}
				max={1}
				step={0.05}
				format={(v) => `${(v * 100).toFixed(0)}%`}
			/>
			<SliderRow
				label="Luxury Cut"
				value={luxuryCut}
				onChange={setLuxuryCut}
				min={0}
				max={1}
				step={0.05}
				format={(v) => `${(v * 100).toFixed(0)}%`}
			/>

			<div
				style={{
					display: "flex",
					gap: 8,
					marginTop: 10,
					padding: 10,
					background: S.bg,
					borderRadius: 8,
				}}
			>
				{(["essential", "discretionary", "luxury"]).map((tier) => {
					const t = TIER_LABELS[tier];
					const val = tier === "essential" ? null : tier === "discretionary" ? discretionaryCut : luxuryCut;
					return (
						<div key={tier} style={{ flex: 1 }}>
							<div style={{ fontSize: 10, color: S.textDim }}>{t.icon} {tier[0].toUpperCase()}{tier.slice(1)}</div>
							<div style={{ fontSize: 12, fontWeight: 600, color: S[t.color] }}>
								{t.note ?? t.fmt(val)}
							</div>
						</div>
					);
				})}
			</div>
		</div>
	);
}
