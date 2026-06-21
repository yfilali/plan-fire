import { useTheme } from "../theme/ThemeProvider.jsx";
import { usePlanner } from "../state/PlannerProvider.jsx";
import { Card, CardHeader, Segmented } from "./ui.jsx";
import SliderRow from "./SliderRow.jsx";

const TIERS = [
	{ key: "essential", icon: "🛡️", label: "Essential", tone: "accent", note: "Never cut" },
	{ key: "discretionary", icon: "⚠️", label: "Discretionary", tone: "warning" },
	{ key: "luxury", icon: "💎", label: "Luxury", tone: "danger" },
];

// Self-contained downturn spending controls, wired to the planner store.
export default function DownturnCutControls() {
	const S = useTheme();
	const {
		discretionaryCut,
		setDiscretionaryCut,
		luxuryCut,
		setLuxuryCut,
		cutMode,
		setCutMode,
	} = usePlanner();

	return (
		<Card>
			<CardHeader
				icon="📉"
				title="Downturn spending controls"
				subtitle="When markets crash you tighten the belt. Tier each expense, then model how deep the cuts go."
			/>
			<div
				style={{
					display: "flex",
					alignItems: "center",
					gap: 10,
					marginBottom: 16,
					flexWrap: "wrap",
				}}
			>
				<span style={{ fontSize: 12, color: S.textMuted, fontWeight: 550 }}>
					Apply cuts
				</span>
				<Segmented
					size="sm"
					value={cutMode}
					onChange={setCutMode}
					options={[
						{ value: "down_recovery", label: "Downturn + recovery" },
						{ value: "all", label: "All years" },
					]}
				/>
			</div>

			<SliderRow
				label="Discretionary cut"
				value={discretionaryCut}
				onChange={setDiscretionaryCut}
				min={0}
				max={1}
				step={0.05}
				format={(v) => `${(v * 100).toFixed(0)}%`}
			/>
			<SliderRow
				label="Luxury cut"
				value={luxuryCut}
				onChange={setLuxuryCut}
				min={0}
				max={1}
				step={0.05}
				format={(v) => `${(v * 100).toFixed(0)}%`}
			/>

			<div
				style={{
					display: "grid",
					gridTemplateColumns: "repeat(3, 1fr)",
					gap: 8,
					marginTop: 12,
				}}
			>
				{TIERS.map((t) => {
					const v =
						t.key === "discretionary"
							? discretionaryCut
							: t.key === "luxury"
								? luxuryCut
								: null;
					return (
						<div
							key={t.key}
							style={{
								padding: "10px 12px",
								background: S.bg,
								borderRadius: 10,
								border: `1px solid ${S.border}`,
							}}
						>
							<div style={{ fontSize: 11, color: S.textMuted }}>
								{t.icon} {t.label}
							</div>
							<div style={{ fontSize: 14, fontWeight: 700, color: S[t.tone], marginTop: 2 }}>
								{t.note ?? `${(v * 100).toFixed(0)}% cut`}
							</div>
						</div>
					);
				})}
			</div>
		</Card>
	);
}
