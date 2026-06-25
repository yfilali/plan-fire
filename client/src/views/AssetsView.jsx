import { useTheme } from "../theme/ThemeProvider.jsx";
import { usePlanner } from "../state/PlannerProvider.jsx";
import { fmt } from "../engine.js";
import { SectionTitle } from "../components/ui.jsx";
import { ASSET_TYPES, assetColor, assetInPlan } from "../lib/assetMeta.js";
import AddAssetForm from "../components/assets/AddAssetForm.jsx";
import AssetRow from "../components/assets/AssetRow.jsx";

export default function AssetsView() {
	const S = useTheme();
	const { assets, addAsset, activePlanId, activePlan, liquidValueForPlan } = usePlanner();

	const liquidTotal = liquidValueForPlan(activePlanId);
	const reEquity = assets
		.filter((a) => a.type === "property" && assetInPlan(a, activePlanId))
		.reduce((s, a) => s + ((Number(a.value) || 0) - (Number(a.mortgage) || 0)), 0);
	const netWorth = liquidTotal + reEquity;

	// Single atomic create — the provider merges the form fields into the new asset.
	const handleAdd = ({ type, ...rest }) => addAsset(type, rest);

	return (
		<div className="fade-in">
			<SectionTitle
				sub={`Everything you own, tagged by plan like expenses. Liquid accounts fund the portfolio that grows; real estate is kept, sold, or rented per plan. Totals reflect "${activePlan?.name}".`}
				right={
					<div style={{ textAlign: "right" }}>
						<div style={{ fontSize: 20, fontWeight: 750, fontFamily: S.mono, color: S.accent }}>
							{fmt(netWorth)}
							<span style={{ fontSize: 12, color: S.textMuted, fontFamily: S.font }}> net worth</span>
						</div>
						<div style={{ fontSize: 11, color: S.textMuted }}>
							{fmt(liquidTotal)} investable · {fmt(reEquity)} real-estate equity
						</div>
					</div>
				}
			>
				Assets
			</SectionTitle>

			<AddAssetForm onAdd={handleAdd} />

			{ASSET_TYPES.map((t) => {
				const items = assets.filter((a) => a.type === t.id);
				if (items.length === 0) return null;
				const c = assetColor(S, t.id);
				const activeTotal = items
					.filter((a) => assetInPlan(a, activePlanId))
					.reduce((s, a) => s + (Number(a.value) || 0), 0);
				return (
					<div key={t.id} style={{ marginBottom: 18 }}>
						<div
							style={{
								display: "flex",
								alignItems: "center",
								gap: 9,
								padding: "4px 0 8px",
								marginBottom: 8,
								borderBottom: `1px solid ${S.border}`,
							}}
						>
							<span style={{ width: 7, height: 7, borderRadius: 3, background: c, boxShadow: `0 0 8px ${c}88`, flexShrink: 0 }} />
							<span style={{ fontSize: 11, fontWeight: 700, color: c, textTransform: "uppercase", letterSpacing: 0.6 }}>
								{t.icon} {t.label}
							</span>
							<span style={{ flex: 1 }} />
							<span style={{ fontSize: 11.5, color: S.textDim, fontFamily: S.mono }}>
								{fmt(activeTotal)}
								<span style={{ fontFamily: S.font }}> {t.liquid ? "in plan" : "value"}</span>
							</span>
						</div>
						{items.map((a) => (
							<AssetRow key={a.id} asset={a} />
						))}
					</div>
				);
			})}

			{assets.length === 0 && (
				<div style={{ fontSize: 13, color: S.textDim, padding: "12px 2px" }}>
					No assets yet — add an account or property above.
				</div>
			)}
		</div>
	);
}
