import { useState } from "react";
import { useTheme } from "../../theme/ThemeProvider.jsx";
import { usePlanner } from "../../state/PlannerProvider.jsx";
import { uid } from "../../engine.js";
import { Card, Chip, TextInput, Select, Button } from "../ui.jsx";
import { planColor } from "../../lib/scenarioMeta.js";

const BLANK = {
	cat: "other",
	name: "",
	amount: "",
	scenarios: ["all"],
	tier: "essential",
	inflOverride: "",
	ageMin: "",
	ageMax: "",
};

export default function AddExpenseForm({ categories, onAdd }) {
	const S = useTheme();
	const { plans } = usePlanner();
	const [draft, setDraft] = useState(BLANK);

	const submit = () => {
		if (!draft.name || !draft.amount) return;
		onAdd({
			id: uid(),
			cat: draft.cat,
			name: draft.name,
			amount: Number(draft.amount),
			scenarios: draft.scenarios,
			tier: draft.tier || "essential",
			inflOverride: draft.inflOverride !== "" ? Number(draft.inflOverride) / 100 : undefined,
			...(draft.ageMin !== "" ? { ageMin: Number(draft.ageMin) } : {}),
			...(draft.ageMax !== "" ? { ageMax: Number(draft.ageMax) } : {}),
		});
		setDraft((p) => ({ ...p, name: "", amount: "" }));
	};

	const toggleScenario = (s) =>
		setDraft((p) => {
			if (s === "all") return { ...p, scenarios: ["all"] };
			const has = p.scenarios.includes(s);
			const next = has
				? p.scenarios.filter((x) => x !== s)
				: [...p.scenarios.filter((x) => x !== "all"), s];
			return { ...p, scenarios: next.length ? next : ["all"] };
		});

	const numStyle = { width: 64, fontFamily: S.mono, padding: "5px 8px", fontSize: 12 };

	return (
		<Card style={{ marginBottom: 16 }}>
			<div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
				<Select value={draft.cat} onChange={(e) => setDraft((p) => ({ ...p, cat: e.target.value }))} style={{ width: 160 }}>
					{categories.map((c) => (
						<option key={c.id} value={c.id}>
							{c.icon} {c.label}
						</option>
					))}
				</Select>
				<TextInput placeholder="Description" value={draft.name} onChange={(e) => setDraft((p) => ({ ...p, name: e.target.value }))} onKeyDown={(e) => e.key === "Enter" && submit()} style={{ flex: 1, minWidth: 140 }} />
				<TextInput placeholder="$/mo" type="number" value={draft.amount} onChange={(e) => setDraft((p) => ({ ...p, amount: e.target.value }))} onKeyDown={(e) => e.key === "Enter" && submit()} style={{ width: 96, fontFamily: S.mono }} />
				<Button variant="primary" onClick={submit}>＋ Add</Button>
			</div>

			<div style={{ display: "flex", gap: 7, alignItems: "center", flexWrap: "wrap" }}>
				<span style={{ fontSize: 11.5, color: S.textDim }}>Applies to</span>
				<Chip active={draft.scenarios.includes("all")} color={S.textMuted} onClick={() => toggleScenario("all")}>
					All plans
				</Chip>
				{plans.map((pl) => (
					<Chip key={pl.id} active={draft.scenarios.includes(pl.id)} color={planColor(S, pl)} onClick={() => toggleScenario(pl.id)}>
						{pl.icon} {pl.name}
					</Chip>
				))}
				<span style={{ fontSize: 11.5, color: S.textDim, marginLeft: 8 }}>Tier</span>
				<Select value={draft.tier} onChange={(e) => setDraft((p) => ({ ...p, tier: e.target.value }))} style={{ padding: "5px 8px", fontSize: 12, width: 130 }}>
					<option value="essential">🛡️ Essential</option>
					<option value="discretionary">⚠️ Discretionary</option>
					<option value="luxury">💎 Luxury</option>
				</Select>
				<span style={{ fontSize: 11.5, color: S.textDim, marginLeft: 8 }}>Ages</span>
				<TextInput placeholder="from" type="number" value={draft.ageMin} onChange={(e) => setDraft((p) => ({ ...p, ageMin: e.target.value }))} style={{ ...numStyle, width: 54 }} />
				<span style={{ fontSize: 11, color: S.textDim }}>–</span>
				<TextInput placeholder="to" type="number" value={draft.ageMax} onChange={(e) => setDraft((p) => ({ ...p, ageMax: e.target.value }))} style={{ ...numStyle, width: 54 }} />
				<span style={{ fontSize: 11.5, color: S.textDim, marginLeft: 8 }}>Infl %</span>
				<TextInput placeholder="CPI" type="number" step="0.5" value={draft.inflOverride} onChange={(e) => setDraft((p) => ({ ...p, inflOverride: e.target.value }))} style={numStyle} />
			</div>
		</Card>
	);
}
