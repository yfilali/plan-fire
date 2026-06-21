import { useTheme } from "../../theme/ThemeProvider.jsx";
import { usePlanner } from "../../state/PlannerProvider.jsx";
import { fmt } from "../../engine.js";
import { btnBase } from "../../lib/styles.js";
import { Card, CardHeader, Field, TextInput, Button } from "../ui.jsx";

function PropertyEditor({ p }) {
	const S = useTheme();
	const { updateProperty, removeProperty, propSaleNet, propRentalNet } = usePlanner();
	const set = (k) => (e) => updateProperty(p.id, { [k]: Number(e.target.value) || 0 });
	const saleNet = propSaleNet(p);
	const rentNet = propRentalNet(p);

	return (
		<div style={{ background: S.bg, borderRadius: 12, border: `1px solid ${S.border}`, padding: 14 }}>
			<div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
				<TextInput value={p.name} onChange={(e) => updateProperty(p.id, { name: e.target.value })} style={{ flex: 1, fontWeight: 600 }} />
				<button onClick={() => removeProperty(p.id)} title="Remove property" style={{ ...btnBase, padding: "7px 11px", borderRadius: 8, border: `1px solid ${S.border}`, background: "transparent", color: S.danger, fontSize: 12 }}>Remove</button>
			</div>
			<div className="col-3">
				<Field label="Market value"><TextInput type="number" value={p.value || 0} onChange={set("value")} style={{ fontFamily: S.mono }} /></Field>
				<Field label="Mortgage owed"><TextInput type="number" value={p.mortgage || 0} onChange={set("mortgage")} style={{ fontFamily: S.mono }} /></Field>
				<Field label="Monthly rent (if rented)"><TextInput type="number" value={p.rentMonthly || 0} onChange={set("rentMonthly")} style={{ fontFamily: S.mono }} /></Field>
			</div>
			<div className="col-2" style={{ marginTop: 4 }}>
				<Field label="Annual rental costs" hint="All-in: mortgage, tax, insurance, maintenance, mgmt">
					<TextInput type="number" value={p.rentCostsAnnual || 0} onChange={set("rentCostsAnnual")} style={{ fontFamily: S.mono }} />
				</Field>
				<div style={{ display: "flex", gap: 20, alignItems: "flex-end", paddingBottom: 6 }}>
					<div>
						<div style={{ fontSize: 11, color: S.textMuted }}>If sold (net)</div>
						<div style={{ fontSize: 15, fontWeight: 700, color: saleNet >= 0 ? S.accent : S.danger, fontFamily: S.mono }}>{fmt(saleNet)}</div>
					</div>
					<div>
						<div style={{ fontSize: 11, color: S.textMuted }}>If rented (net/yr)</div>
						<div style={{ fontSize: 15, fontWeight: 700, color: rentNet >= 0 ? S.accent : S.danger, fontFamily: S.mono }}>{rentNet >= 0 ? "+" : ""}{fmt(rentNet)}</div>
					</div>
				</div>
			</div>
		</div>
	);
}

export default function PropertySettings() {
	const { properties, addProperty } = usePlanner();
	return (
		<Card>
			<CardHeader
				icon="🏘️"
				title="Properties"
				subtitle="Add as many (or as few) properties as you have. Plans decide whether each is kept, sold, or rented."
				right={<Button onClick={addProperty}>＋ Add property</Button>}
			/>
			<div style={{ display: "grid", gap: 12 }}>
				{properties.length === 0 && (
					<div style={{ fontSize: 13, color: "var(--text-dim)", padding: "8px 0" }}>
						No properties. Add one, or leave empty if you rent / own nothing.
					</div>
				)}
				{properties.map((p) => (
					<PropertyEditor key={p.id} p={p} />
				))}
			</div>
		</Card>
	);
}
