import { useTheme } from "../../theme/ThemeProvider.jsx";
import { btnBase } from "../../lib/styles.js";
import { Badge } from "../ui.jsx";
import { planColor } from "../../lib/planMeta.js";

export default function PlanCard({ plan, active, summary, onSelect, onEdit, onDelete, canDelete }) {
	const S = useTheme();
	const c = planColor(S, plan);
	return (
		<div
			onClick={onSelect}
			style={{
				cursor: "pointer",
				padding: "15px 16px",
				borderRadius: 14,
				border: `2px solid ${active ? c : S.border}`,
				background: active ? c + "10" : S.card,
				display: "flex",
				flexDirection: "column",
				gap: 8,
				position: "relative",
			}}
		>
			<div style={{ display: "flex", alignItems: "center", gap: 10 }}>
				<span style={{ fontSize: 22 }}>{plan.icon}</span>
				<div style={{ flex: 1, minWidth: 0 }}>
					<div style={{ fontSize: 14.5, fontWeight: 700, color: active ? c : S.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
						{plan.name}
					</div>
				</div>
				{plan.baseline && <Badge color={S.textMuted}>Baseline</Badge>}
			</div>
			<div style={{ fontSize: 12, color: S.textMuted, minHeight: 32, lineHeight: 1.45 }}>{summary}</div>
			<div style={{ display: "flex", gap: 6, marginTop: 2 }}>
				<button
					onClick={(e) => { e.stopPropagation(); onEdit(); }}
					style={{ ...btnBase, flex: 1, padding: "6px 0", borderRadius: 8, border: `1px solid ${S.border}`, background: "transparent", color: S.textMuted, fontSize: 12, fontWeight: 550 }}
				>
					Edit
				</button>
				{canDelete && (
					<button
						onClick={(e) => { e.stopPropagation(); onDelete(); }}
						style={{ ...btnBase, padding: "6px 12px", borderRadius: 8, border: `1px solid ${S.border}`, background: "transparent", color: S.danger, fontSize: 12 }}
					>
						✕
					</button>
				)}
			</div>
			{active && (
				<div style={{ position: "absolute", top: 12, right: 12, fontSize: 11, color: c, fontWeight: 700 }}>
					● Active
				</div>
			)}
		</div>
	);
}
