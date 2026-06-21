import { useTheme } from "../theme/ThemeProvider.jsx";
import { usePlanner } from "../state/PlannerProvider.jsx";
import { fmt } from "../engine.js";
import { btnBase } from "../lib/styles.js";
import { SectionTitle, Card, CardHeader, StatCard } from "../components/ui.jsx";
import { HOUSING_OPTIONS } from "../lib/scenarioMeta.js";

export default function PlanView() {
	const S = useTheme();
	const {
		housingPlan,
		setHousingPlan,
		houseNet,
		byersNet,
		totalRENet,
		ccHomeCost,
		netRental,
		transitionYears,
		age,
	} = usePlanner();

	const tone = (t) => S[t];

	return (
		<div className="fade-in">
			<SectionTitle sub="Pick the path you want to model. Each scenario reshapes your costs, proceeds, and projection.">
				Housing Plan
			</SectionTitle>

			<div className="col-3" style={{ marginBottom: 20 }}>
				{HOUSING_OPTIONS.map((o) => {
					const active = housingPlan === o.id;
					const c = tone(o.tone);
					return (
						<button
							key={o.id}
							onClick={() => setHousingPlan(o.id)}
							style={{
								...btnBase,
								padding: "16px 18px",
								borderRadius: 14,
								textAlign: "left",
								border: `2px solid ${active ? c : S.border}`,
								background: active ? c + "12" : S.card,
							}}
						>
							<div style={{ fontSize: 22, marginBottom: 6 }}>{o.icon}</div>
							<div style={{ fontSize: 14.5, fontWeight: 700, color: active ? c : S.text }}>
								{o.label}
							</div>
							<div style={{ fontSize: 12, color: S.textMuted, marginTop: 4 }}>{o.desc}</div>
						</button>
					);
				})}
			</div>

			{/* Impact summary for the selected plan */}
			<div className="stat-grid" style={{ marginBottom: 20 }}>
				{housingPlan === "sell_move" && (
					<>
						<StatCard label="Current home net" value={fmt(houseNet)} color={S.accent} />
						<StatCard label="Other property net" value={fmt(byersNet)} color={S.accent} />
						<StatCard label="New home" value={`-${fmt(ccHomeCost)}`} color={S.danger} />
						<StatCard label="To portfolio" value={fmt(totalRENet - ccHomeCost)} accent={totalRENet - ccHomeCost >= 0 ? S.accent : S.danger} color={totalRENet - ccHomeCost >= 0 ? S.accent : S.danger} />
						<StatCard label="Move at age" value={age + transitionYears} sub={`${transitionYears}-yr transition`} />
					</>
				)}
				{housingPlan === "rent_out" && (
					<>
						<StatCard label="Net rental cash flow" value={`${netRental >= 0 ? "+" : ""}${fmt(netRental)}/yr`} accent={netRental >= 0 ? S.accent : S.danger} color={netRental >= 0 ? S.accent : S.danger} />
						<StatCard label="Other property net" value={fmt(byersNet)} color={S.accent} />
						<StatCard label="New home" value={`-${fmt(ccHomeCost)}`} color={S.danger} />
						<StatCard label="From portfolio" value={fmt(byersNet - ccHomeCost)} color={byersNet - ccHomeCost >= 0 ? S.accent : S.danger} />
					</>
				)}
				{housingPlan === "stay" && (
					<StatCard label="Properties" value="Unchanged" sub="No transition modeled" />
				)}
			</div>

			<Card>
				<CardHeader title="How each plan works" />
				<div style={{ display: "grid", gap: 14 }}>
					{HOUSING_OPTIONS.map((o) => (
						<div key={o.id}>
							<span style={{ fontSize: 13, fontWeight: 650, color: S[o.tone] }}>
								{o.icon} {o.label}
							</span>
							<p style={{ fontSize: 12.5, color: S.textMuted, margin: "4px 0 0", lineHeight: 1.55 }}>
								{o.id === "stay" &&
									"Keep your home and mortgage. Higher monthly carrying costs but no transition. Property taxes track the current assessment."}
								{o.id === "sell_move" &&
									"Sell both properties and buy in a lower-cost area. Lower ongoing costs, but a transition gap where you may need temporary housing. Net proceeds flow into the portfolio."}
								{o.id === "rent_out" &&
									"Keep your home as a rental, sell the secondary property, and buy in a lower-cost area. Rental income offsets costs but adds landlord responsibilities and vacancy risk."}
							</p>
						</div>
					))}
				</div>
				<p style={{ fontSize: 12, color: S.textDim, marginTop: 16 }}>
					Tune the dollar amounts for each plan under <strong style={{ color: S.textMuted }}>Assumptions → Property &amp; real estate</strong>.
				</p>
			</Card>
		</div>
	);
}
