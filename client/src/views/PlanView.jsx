import { useState } from "react";
import { useTheme } from "../theme/ThemeProvider.jsx";
import { usePlanner } from "../state/PlannerProvider.jsx";
import { fmt } from "../engine.js";
import { SectionTitle, Card, CardHeader, StatCard, Button } from "../components/ui.jsx";
import PlanCard from "../components/plans/PlanCard.jsx";
import PlanEditor from "../components/plans/PlanEditor.jsx";

export default function PlanView() {
	const S = useTheme();
	const {
		plans,
		properties,
		activePlanId,
		setActivePlanId,
		activePlan,
		activeEcon,
		addPlan,
		removePlan,
		propSaleNet,
		propRentalNet,
		age,
	} = usePlanner();

	const [editing, setEditing] = useState(null);

	const summarize = (plan) => {
		if (plan.baseline && Object.values(plan.actions || {}).every((a) => a === "keep") && !plan.newHomeCost) {
			return "Your current situation — keep everything as-is.";
		}
		const parts = [];
		let sold = 0;
		let rent = 0;
		for (const p of properties) {
			const a = plan.actions?.[p.id] || "keep";
			if (a === "sell") sold += propSaleNet(p);
			if (a === "rent") rent += propRentalNet(p);
		}
		if (sold) parts.push(`+${fmt(sold)} from sales`);
		if (rent) parts.push(`${rent >= 0 ? "+" : ""}${fmt(rent)}/yr rental`);
		if (plan.newHomeCost) parts.push(`buy ${fmt(plan.newHomeCost)}`);
		if (plan.transitionYears) parts.push(`in ${plan.transitionYears} yr`);
		return parts.length ? parts.join(" · ") : "No property changes.";
	};

	return (
		<div className="fade-in">
			<SectionTitle
				sub="Each plan is a full alternative you can compare: its own housing configuration, profile inputs, and the expenses/assets tagged to it. Select one to drive the dashboard."
				right={<Button variant="primary" onClick={() => { const id = addPlan(); setEditing(id); }}>＋ New plan</Button>}
			>
				Plans
			</SectionTitle>

			<div className="col-3" style={{ marginBottom: 20 }}>
				{plans.map((plan) => (
					<PlanCard
						key={plan.id}
						plan={plan}
						active={plan.id === activePlanId}
						summary={summarize(plan)}
						onSelect={() => setActivePlanId(plan.id)}
						onEdit={() => setEditing(plan.id)}
						onDelete={() => {
							if (confirm(`Delete plan "${plan.name}"? Expenses and assets tagged to it will revert to All plans.`)) removePlan(plan.id);
						}}
						canDelete={plans.length > 1}
					/>
				))}
			</div>

			{/* Impact of the selected plan */}
			<Card>
				<CardHeader title={`Impact — ${activePlan?.name}`} subtitle="How this plan changes your portfolio at the transition." />
				<div className="stat-grid">
					<StatCard label="Sale proceeds" value={fmt(activeEcon.soldNet)} color={activeEcon.soldNet ? S.accent : S.text} />
					<StatCard label="New home" value={activeEcon.newHomeCost ? `-${fmt(activeEcon.newHomeCost)}` : "—"} color={activeEcon.newHomeCost ? S.danger : S.text} />
					<StatCard label="Net to portfolio" value={fmt(activeEcon.soldNet - activeEcon.newHomeCost)} accent={activeEcon.soldNet - activeEcon.newHomeCost >= 0 ? S.accent : S.danger} color={activeEcon.soldNet - activeEcon.newHomeCost >= 0 ? S.accent : S.danger} />
					<StatCard label="Rental cash flow" value={activeEcon.rentalNet ? `${activeEcon.rentalNet >= 0 ? "+" : ""}${fmt(activeEcon.rentalNet)}/yr` : "—"} color={activeEcon.rentalNet >= 0 ? S.accent : S.danger} />
					<StatCard label="Transition" value={activeEcon.relocates ? `Age ${age + activeEcon.transitionYears}` : "—"} sub={activeEcon.relocates ? `${activeEcon.transitionYears}-yr` : "No move"} />
				</div>
				<p style={{ fontSize: 12, color: S.textDim, marginTop: 14 }}>
					Edit property values under <strong style={{ color: S.textMuted }}>Assumptions → Properties</strong>.
				</p>
			</Card>

			{editing && <PlanEditor planId={editing} onClose={() => setEditing(null)} />}
		</div>
	);
}
