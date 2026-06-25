import { useTheme } from "../../theme/ThemeProvider.jsx";
import { usePlanner } from "../../state/PlannerProvider.jsx";
import { fmt } from "../../engine.js";
import { btnBase } from "../../lib/styles.js";
import { TextInput } from "../ui.jsx";
import { assetType, assetColor, assetInPlan } from "../../lib/assetMeta.js";
import PlanTagChips from "./PlanTagChips.jsx";

const RemoveBtn = ({ S, onClick }) => (
	<button
		onClick={onClick}
		title="Remove asset"
		style={{ ...btnBase, padding: "5px 9px", borderRadius: 8, border: `1px solid ${S.border}`, background: "transparent", color: S.danger, fontSize: 11.5 }}
	>
		✕
	</button>
);

export default function AssetRow({ asset }) {
	const S = useTheme();
	const { updateAsset, removeAsset, activePlanId, propSaleNet, propRentalNet } = usePlanner();
	const meta = assetType(asset.type);
	const c = assetColor(S, asset.type);
	const inPlan = assetInPlan(asset, activePlanId);
	const num = (k) => (e) => updateAsset(asset.id, { [k]: Number(e.target.value) || 0 });
	const mono = { fontFamily: S.mono };

	// ── Real estate: card with full fields + sale/rental economics ──
	if (asset.type === "property") {
		const saleNet = propSaleNet(asset);
		const rentNet = propRentalNet(asset);
		return (
			<div
				className="row-hover"
				style={{
					background: S.card,
					borderRadius: 12,
					border: `1px solid ${S.border}`,
					borderLeft: `3px solid ${c}`,
					padding: 14,
					marginBottom: 8,
					opacity: inPlan ? 1 : 0.5,
				}}
			>
				<div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
					<span style={{ fontSize: 16 }}>{meta.icon}</span>
					<TextInput value={asset.name} onChange={(e) => updateAsset(asset.id, { name: e.target.value })} style={{ flex: 1, fontWeight: 600 }} />
					<RemoveBtn S={S} onClick={() => removeAsset(asset.id)} />
				</div>
				<div className="col-3">
					<Labeled S={S} label="Market value"><TextInput type="number" value={asset.value || 0} onChange={num("value")} style={mono} /></Labeled>
					<Labeled S={S} label="Mortgage owed"><TextInput type="number" value={asset.mortgage || 0} onChange={num("mortgage")} style={mono} /></Labeled>
					<Labeled S={S} label="Monthly rent (if rented)"><TextInput type="number" value={asset.rentMonthly || 0} onChange={num("rentMonthly")} style={mono} /></Labeled>
				</div>
				<div className="col-2" style={{ marginTop: 4 }}>
					<Labeled S={S} label="Annual rental costs" hint="All-in: mortgage, tax, insurance, maintenance, mgmt">
						<TextInput type="number" value={asset.rentCostsAnnual || 0} onChange={num("rentCostsAnnual")} style={mono} />
					</Labeled>
					<div style={{ display: "flex", gap: 22, alignItems: "flex-end", paddingBottom: 6 }}>
						<Stat S={S} label="If sold (net)" value={fmt(saleNet)} color={saleNet >= 0 ? S.accent : S.danger} />
						<Stat S={S} label="If rented (net/yr)" value={`${rentNet >= 0 ? "+" : ""}${fmt(rentNet)}`} color={rentNet >= 0 ? S.accent : S.danger} />
					</div>
				</div>
				<div style={{ marginTop: 12, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
					<PlanTagChips value={asset.plans} onChange={(plans) => updateAsset(asset.id, { plans })} />
					<span style={{ fontSize: 11, color: S.textDim }}>Keep / sell / rent is set per plan under <strong style={{ color: S.textMuted }}>Plans</strong>.</span>
				</div>
			</div>
		);
	}

	// ── Liquid asset: compact inline row ──
	return (
		<div
			className="row-hover"
			style={{
				display: "flex",
				alignItems: "center",
				gap: 10,
				padding: "9px 12px",
				background: S.card,
				borderRadius: 10,
				border: `1px solid ${S.border}`,
				borderLeft: `3px solid ${c}`,
				marginBottom: 6,
				opacity: inPlan ? 1 : 0.5,
				flexWrap: "wrap",
			}}
		>
			<span style={{ fontSize: 15 }}>{meta.icon}</span>
			<TextInput
				value={asset.name}
				onChange={(e) => updateAsset(asset.id, { name: e.target.value })}
				style={{ flex: 1, minWidth: 130, fontWeight: 600, padding: "6px 10px" }}
			/>
			<div style={{ position: "relative" }}>
				<span style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)", fontSize: 12.5, color: S.textDim, fontFamily: S.mono }}>$</span>
				<TextInput
					type="number"
					value={asset.value || 0}
					onChange={num("value")}
					style={{ width: 140, textAlign: "right", fontFamily: S.mono, fontWeight: 650, padding: "6px 10px 6px 16px" }}
				/>
			</div>
			<PlanTagChips label="" value={asset.plans} onChange={(plans) => updateAsset(asset.id, { plans })} />
			<RemoveBtn S={S} onClick={() => removeAsset(asset.id)} />
		</div>
	);
}

function Labeled({ S, label, hint, children }) {
	return (
		<label style={{ display: "block" }}>
			<div style={{ fontSize: 11.5, color: S.textMuted, marginBottom: 5, fontWeight: 550 }}>{label}</div>
			{children}
			{hint && <div style={{ fontSize: 10.5, color: S.textDim, marginTop: 4 }}>{hint}</div>}
		</label>
	);
}

function Stat({ S, label, value, color }) {
	return (
		<div>
			<div style={{ fontSize: 11, color: S.textMuted }}>{label}</div>
			<div style={{ fontSize: 15, fontWeight: 700, color, fontFamily: S.mono }}>{value}</div>
		</div>
	);
}
