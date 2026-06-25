import { useTheme } from "../../theme/ThemeProvider.jsx";
import { usePlanner } from "../../state/PlannerProvider.jsx";
import { btnBase } from "../../lib/styles.js";
import { planColor, togglePlanTag } from "../../lib/planMeta.js";

// Plan membership chips, shared by the asset add-form and rows. Mirrors the
// expense tagging UX: "All" plus one chip per plan.
export default function PlanTagChips({ value, onChange, label = "Included in", size = "sm" }) {
	const S = useTheme();
	const { plans } = usePlanner();
	const tags = value && value.length ? value : ["all"];
	const btns = [{ id: "all" }, ...plans];
	const pad = size === "sm" ? "2px 9px" : "3px 11px";
	const fs = size === "sm" ? 10 : 11.5;

	return (
		<div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
			{label && (
				<span
					style={{
						fontSize: 10.5,
						color: S.textDim,
						fontWeight: 600,
						textTransform: "uppercase",
						letterSpacing: 0.4,
					}}
				>
					{label}
				</span>
			)}
			{btns.map((pl) => {
				const on = tags.includes(pl.id);
				const c = pl.id === "all" ? S.textMuted : planColor(S, pl);
				return (
					<button
						key={pl.id}
						type="button"
						onClick={() => onChange(togglePlanTag(tags, pl.id))}
						title={pl.id === "all" ? "All plans" : pl.name}
						style={{
							...btnBase,
							padding: pad,
							borderRadius: 20,
							fontSize: fs,
							fontWeight: 600,
							border: `1.5px solid ${on ? c : S.border}`,
							background: on ? c + "22" : "transparent",
							color: on ? c : S.textMuted,
						}}
					>
						{pl.id === "all" ? "All" : `${pl.icon} ${pl.name}`}
					</button>
				);
			})}
		</div>
	);
}
