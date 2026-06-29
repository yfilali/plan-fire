import { useTheme } from "../../theme/ThemeProvider.jsx";
import { btnBase } from "../../lib/styles.js";
import { Badge } from "../ui.jsx";
import { planColor } from "../../lib/planMeta.js";
import { healthVisual } from "../../lib/planHealth.js";
import Icon from "../Icon.jsx";
import { fmt } from "../../engine.js";

export default function PlanCard({ plan, active, summary, outcome, onSelect, onEdit, onDelete, canDelete }) {
	const S = useTheme();
	const c = planColor(S, plan);
	const hv = outcome ? healthVisual(outcome.health.status, S) : null;
	return (
		<div
			onClick={onSelect}
			className="lift"
			style={{
				cursor: "pointer",
				padding: "15px 16px",
				borderRadius: 16,
				border: `1.5px solid ${active ? c : S.border}`,
				background: active
					? `linear-gradient(160deg, ${c}1c, ${c}08)`
					: S.card,
				boxShadow: active ? `0 8px 26px -10px ${c}55` : S.shadowSm,
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

			{/* Compact scorecard strip — driven by the per-plan outcome. Guarded so
			    the card still renders cleanly while outcomes are loading. */}
			{outcome && (
				<div
					style={{
						display: "flex",
						alignItems: "center",
						gap: 8,
						padding: "8px 10px",
						borderRadius: 10,
						border: `1px solid ${S.border}`,
						background: S.surface,
					}}
				>
					{/* Health pill — colored icon + label (never color alone) */}
					<div
						style={{
							display: "inline-flex",
							alignItems: "center",
							gap: 5,
							padding: "3px 8px",
							borderRadius: 999,
							background: `${hv.color}1f`,
							color: hv.color,
							fontSize: 11,
							fontWeight: 700,
							whiteSpace: "nowrap",
						}}
						title={outcome.health.reasons?.[0]}
					>
						<Icon name={hv.icon} size={13} color={hv.color} />
						{hv.label}
					</div>

					<div style={{ flex: 1 }} />

					{/* Ending balance */}
					<div style={{ textAlign: "right", lineHeight: 1.2 }}>
						<div style={{ fontSize: 13, fontWeight: 700, color: S.text }}>
							{fmt(outcome.endingBalanceNominal)}
						</div>
						<div style={{ fontSize: 9.5, color: S.textDim, textTransform: "uppercase", letterSpacing: 0.4 }}>
							ending $
						</div>
					</div>

					{/* Longevity — runs out vs lasts */}
					<div
						style={{
							textAlign: "right",
							lineHeight: 1.2,
							paddingLeft: 8,
							borderLeft: `1px solid ${S.border}`,
						}}
					>
						<div
							style={{
								fontSize: 12,
								fontWeight: 700,
								color: outcome.runsOutAge ? S.danger : S.accent,
								whiteSpace: "nowrap",
							}}
						>
							{outcome.runsOutAge ? outcome.runsOutAge : outcome.endAge}
						</div>
						<div style={{ fontSize: 9.5, color: S.textDim, textTransform: "uppercase", letterSpacing: 0.4 }}>
							{outcome.runsOutAge ? "runs out" : "lasts to"}
						</div>
					</div>
				</div>
			)}

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
