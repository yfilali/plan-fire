import { useTheme } from "../../theme/ThemeProvider.jsx";
import { usePlanner, PLAN_TONES, PLAN_ICONS } from "../../state/PlannerProvider.jsx";
import { fmt } from "../../engine.js";
import { btnBase } from "../../lib/styles.js";
import { Modal, Field, TextInput, Segmented, Button } from "../ui.jsx";
import { planColor } from "../../lib/planMeta.js";

const ACTIONS = [
	{ value: "keep", label: "Keep" },
	{ value: "sell", label: "Sell" },
	{ value: "rent", label: "Rent" },
];

export default function PlanEditor({ planId, onClose }) {
	const S = useTheme();
	const { plans, properties, updatePlan, setPlanAction, propSaleNet, propRentalNet } = usePlanner();
	const plan = plans.find((p) => p.id === planId);
	if (!plan) return null;

	const set = (patch) => updatePlan(plan.id, patch);

	return (
		<Modal title="Edit plan" width={560} onClose={onClose} footer={<Button variant="primary" onClick={onClose}>Done</Button>}>
			<div style={{ display: "grid", gap: 18 }}>
				<div style={{ display: "flex", gap: 12, alignItems: "flex-end", flexWrap: "wrap" }}>
					<Field label="Plan name" style={{ flex: 1, minWidth: 180 }}>
						<TextInput value={plan.name} onChange={(e) => set({ name: e.target.value })} />
					</Field>
					<Field label="Baseline">
						<Segmented
							value={!!plan.baseline}
							onChange={(v) => set({ baseline: v })}
							options={[
								{ value: false, label: "No" },
								{ value: true, label: "Current life" },
							]}
						/>
					</Field>
				</div>

				<div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
					<Field label="Icon">
						<div style={{ display: "flex", gap: 4, flexWrap: "wrap", maxWidth: 280 }}>
							{PLAN_ICONS.map((ic) => (
								<button key={ic} onClick={() => set({ icon: ic })} style={{ ...btnBase, width: 30, height: 30, borderRadius: 8, fontSize: 15, border: plan.icon === ic ? `2px solid ${S.accent}` : `1px solid ${S.border}`, background: plan.icon === ic ? S.accent + "22" : "transparent" }}>
									{ic}
								</button>
							))}
						</div>
					</Field>
					<Field label="Color">
						<div style={{ display: "flex", gap: 6 }}>
							{PLAN_TONES.map((t) => (
								<button key={t} onClick={() => set({ tone: t })} style={{ ...btnBase, width: 24, height: 24, borderRadius: 12, background: S[t], border: plan.tone === t ? `2px solid ${S.text}` : "2px solid transparent" }} />
							))}
						</div>
					</Field>
				</div>

				<div>
					<div style={{ fontSize: 12.5, fontWeight: 600, color: S.text, marginBottom: 4 }}>What happens to each property</div>
					<div style={{ fontSize: 11.5, color: S.textMuted, marginBottom: 10 }}>
						Sell adds net proceeds to the portfolio; rent adds its annual cash flow.
					</div>
					{properties.length === 0 && (
						<div style={{ fontSize: 12.5, color: S.textDim, padding: "8px 0" }}>
							No properties yet — add them under Assumptions → Properties.
						</div>
					)}
					<div style={{ display: "grid", gap: 8 }}>
						{properties.map((p) => {
							const action = plan.actions?.[p.id] || "keep";
							const hint = action === "sell" ? `+${fmt(propSaleNet(p))} proceeds` : action === "rent" ? `${propRentalNet(p) >= 0 ? "+" : ""}${fmt(propRentalNet(p))}/yr` : "unchanged";
							return (
								<div key={p.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "9px 12px", background: S.bg, borderRadius: 10, border: `1px solid ${S.border}`, flexWrap: "wrap" }}>
									<div style={{ flex: 1, minWidth: 120 }}>
										<div style={{ fontSize: 13, fontWeight: 600, color: S.text }}>{p.name}</div>
										<div style={{ fontSize: 11, color: S.textMuted, fontFamily: S.mono }}>{hint}</div>
									</div>
									<Segmented size="sm" value={action} onChange={(v) => setPlanAction(plan.id, p.id, v)} options={ACTIONS} />
								</div>
							);
						})}
					</div>
				</div>

				<div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
					<Field label="New home purchase ($, 0 = none)" hint="Bought at the transition" style={{ flex: 1, minWidth: 180 }}>
						<TextInput type="number" value={plan.newHomeCost || 0} onChange={(e) => set({ newHomeCost: Number(e.target.value) || 0 })} style={{ fontFamily: S.mono }} />
					</Field>
					<Field label="Transition in (years from now)" hint="0 = happens immediately" style={{ width: 200 }}>
						<TextInput type="number" value={plan.transitionYears || 0} onChange={(e) => set({ transitionYears: Math.max(0, Number(e.target.value) || 0) })} style={{ fontFamily: S.mono }} />
					</Field>
				</div>

				<div style={{ height: 1, background: S.border }} />
				<div style={{ display: "flex", alignItems: "center", gap: 8 }}>
					<span style={{ width: 12, height: 12, borderRadius: 7, background: planColor(S, plan) }} />
					<span style={{ fontSize: 12, color: S.textMuted }}>
						Tag expenses to this plan from the Expenses tab to model plan-specific costs.
					</span>
				</div>
				<div style={{ fontSize: 12, color: S.textDim }}>
					Profile inputs for this plan are edited under <strong style={{ color: S.textMuted }}>Settings → Profile</strong>, and market assumptions under <strong style={{ color: S.textMuted }}>Markets</strong>, while it is the active plan.
				</div>
			</div>
		</Modal>
	);
}
