import { useState } from "react";
import { useTheme } from "../../theme/ThemeProvider.jsx";
import { Card, TextInput, Select, Button } from "../ui.jsx";
import { ASSET_TYPES, assetType } from "../../lib/assetMeta.js";
import PlanTagChips from "./PlanTagChips.jsx";

const BLANK = {
	type: "investment",
	name: "",
	value: "",
	mortgage: "",
	rentMonthly: "",
	rentCostsAnnual: "",
	plans: ["all"],
};

export default function AddAssetForm({ onAdd }) {
	const S = useTheme();
	const [draft, setDraft] = useState(BLANK);
	const isProp = draft.type === "property";

	const submit = () => {
		if (!draft.name || draft.value === "") return;
		const common = {
			type: draft.type,
			name: draft.name,
			value: Number(draft.value) || 0,
			plans: draft.plans?.length ? draft.plans : ["all"],
		};
		onAdd(
			isProp
				? {
						...common,
						mortgage: Number(draft.mortgage) || 0,
						rentMonthly: Number(draft.rentMonthly) || 0,
						rentCostsAnnual: Number(draft.rentCostsAnnual) || 0,
					}
				: common,
		);
		setDraft((p) => ({ ...BLANK, type: p.type, plans: p.plans }));
	};

	const mono = { fontFamily: S.mono };

	return (
		<Card style={{ marginBottom: 18 }}>
			<div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
				<Select
					value={draft.type}
					onChange={(e) => setDraft((p) => ({ ...p, type: e.target.value }))}
					style={{ width: 190 }}
				>
					{ASSET_TYPES.map((t) => (
						<option key={t.id} value={t.id}>
							{t.icon} {t.label}
						</option>
					))}
				</Select>
				<TextInput
					placeholder={isProp ? "Property name" : "Account name"}
					value={draft.name}
					onChange={(e) => setDraft((p) => ({ ...p, name: e.target.value }))}
					onKeyDown={(e) => e.key === "Enter" && submit()}
					style={{ flex: 1, minWidth: 150 }}
				/>
				<TextInput
					placeholder={isProp ? "Market value" : "Balance $"}
					type="number"
					value={draft.value}
					onChange={(e) => setDraft((p) => ({ ...p, value: e.target.value }))}
					onKeyDown={(e) => e.key === "Enter" && submit()}
					style={{ width: 130, ...mono }}
				/>
				<Button variant="primary" onClick={submit}>＋ Add</Button>
			</div>

			{isProp && (
				<div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
					<TextInput placeholder="Mortgage owed" type="number" value={draft.mortgage} onChange={(e) => setDraft((p) => ({ ...p, mortgage: e.target.value }))} style={{ width: 150, ...mono }} />
					<TextInput placeholder="Monthly rent" type="number" value={draft.rentMonthly} onChange={(e) => setDraft((p) => ({ ...p, rentMonthly: e.target.value }))} style={{ width: 140, ...mono }} />
					<TextInput placeholder="Annual rental costs" type="number" value={draft.rentCostsAnnual} onChange={(e) => setDraft((p) => ({ ...p, rentCostsAnnual: e.target.value }))} style={{ width: 170, ...mono }} />
				</div>
			)}

			<div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
				<PlanTagChips
					label="Applies to"
					value={draft.plans}
					onChange={(plans) => setDraft((p) => ({ ...p, plans }))}
				/>
				<span style={{ fontSize: 11.5, color: S.textDim, maxWidth: 360 }}>
					{assetType(draft.type).blurb}
				</span>
			</div>
		</Card>
	);
}
