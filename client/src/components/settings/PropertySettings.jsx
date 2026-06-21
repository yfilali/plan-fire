import { useTheme } from "../../theme/ThemeProvider.jsx";
import { usePlanner } from "../../state/PlannerProvider.jsx";
import { fmt } from "../../engine.js";
import { Card, CardHeader, StatCard } from "../ui.jsx";
import SliderRow from "../SliderRow.jsx";

function MiniStats({ items }) {
	return (
		<div className="stat-grid" style={{ marginTop: 8 }}>
			{items.map((x, i) => (
				<StatCard key={i} label={x.l} value={x.v} color={x.c} />
			))}
		</div>
	);
}

export default function PropertySettings() {
	const S = useTheme();
	const {
		housingPlan,
		houseValue, setHouseValue,
		mortgageOwed, setMortgageOwed,
		byersValue, setByersValue,
		ccHomeCost, setCcHomeCost,
		transitionYears, setTransitionYears,
		monthlyRent, setMonthlyRent,
		monthlyMortgage, setMonthlyMortgage,
		annualPropTax, setAnnualPropTax,
		annualLandlordCosts, setAnnualLandlordCosts,
		houseNet, byersNet, totalRENet, grossRent, landlordExp, netRental,
	} = usePlanner();

	return (
		<Card>
			<CardHeader icon="🏘️" title="Property & real estate" subtitle="Values feed the housing-plan proceeds and rental cash flow." />

			<div className="col-3">
				<SliderRow label="Current home value" value={houseValue} onChange={setHouseValue} min={1e6} max={3e6} step={50000} format={fmt} />
				<SliderRow label="Mortgage owed" value={mortgageOwed} onChange={setMortgageOwed} min={0} max={1e6} step={25000} format={fmt} />
				<SliderRow label="Second property value" value={byersValue} onChange={setByersValue} min={200000} max={1e6} step={25000} format={fmt} />
			</div>

			{housingPlan !== "stay" && (
				<div style={{ background: S.bg, borderRadius: 12, padding: 16, marginTop: 12, border: `1px solid ${S.border}` }}>
					<div style={{ fontSize: 13, fontWeight: 650, marginBottom: 10, color: S.text }}>🌲 Relocation</div>
					<div className="col-2">
						<SliderRow label="New home price" value={ccHomeCost} onChange={setCcHomeCost} min={200000} max={1500000} step={25000} format={fmt} />
						{housingPlan === "sell_move" && (
							<SliderRow label="Transition years" value={transitionYears} onChange={setTransitionYears} min={0} max={3} step={1} format={(v) => `${v} yr`} />
						)}
					</div>
					{housingPlan === "sell_move" ? (
						<MiniStats
							items={[
								{ l: "Home net", v: fmt(houseNet), c: S.accent },
								{ l: "Second net", v: fmt(byersNet), c: S.accent },
								{ l: "New home", v: `-${fmt(ccHomeCost)}`, c: S.danger },
								{ l: "To portfolio", v: fmt(totalRENet - ccHomeCost), c: totalRENet - ccHomeCost >= 0 ? S.accent : S.danger },
							]}
						/>
					) : (
						<MiniStats
							items={[
								{ l: "Second net", v: fmt(byersNet), c: S.accent },
								{ l: "New home", v: `-${fmt(ccHomeCost)}`, c: S.danger },
								{ l: "From portfolio", v: fmt(byersNet - ccHomeCost), c: byersNet - ccHomeCost >= 0 ? S.accent : S.danger },
							]}
						/>
					)}
				</div>
			)}

			{housingPlan === "rent_out" && (
				<div style={{ background: S.bg, borderRadius: 12, padding: 16, marginTop: 12, border: `1px solid ${S.border}` }}>
					<div style={{ fontSize: 13, fontWeight: 650, marginBottom: 10, color: S.text }}>🏠 Rental P&amp;L</div>
					<div className="col-2">
						<SliderRow label="Monthly rent" value={monthlyRent} onChange={setMonthlyRent} min={3000} max={7000} step={100} format={(v) => `$${v.toLocaleString()}/mo`} />
						<SliderRow label="Monthly mortgage" value={monthlyMortgage} onChange={setMonthlyMortgage} min={1500} max={4000} step={100} format={(v) => `$${v.toLocaleString()}/mo`} />
						<SliderRow label="Annual property tax" value={annualPropTax} onChange={setAnnualPropTax} min={5000} max={25000} step={500} format={(v) => `${fmt(v)}/yr`} />
						<SliderRow label="Insurance + maint + mgmt" value={annualLandlordCosts} onChange={setAnnualLandlordCosts} min={5000} max={25000} step={500} format={(v) => `${fmt(v)}/yr`} />
					</div>
					<MiniStats
						items={[
							{ l: "Gross rent", v: fmt(grossRent), c: S.accent },
							{ l: "Expenses", v: fmt(landlordExp), c: S.danger },
							{ l: "Net flow", v: `${netRental >= 0 ? "+" : ""}${fmt(netRental)}/yr`, c: netRental >= 0 ? S.accent : S.danger },
						]}
					/>
				</div>
			)}
		</Card>
	);
}
