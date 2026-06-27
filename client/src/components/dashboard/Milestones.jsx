import { useMemo } from "react";
import { useTheme } from "../../theme/ThemeProvider.jsx";
import { usePlanner } from "../../state/PlannerProvider.jsx";
import { Card, CardHeader } from "../ui.jsx";
import { computeMilestones } from "../../lib/milestones.js";

// Free teaser: the headline ages on the road to FI, derived from the live
// projection. Reached marks glow accent; future marks stay muted.
export default function MilestonesCard() {
	const S = useTheme();
	const { age, retireAge, realRet, spendNow, projections } = usePlanner();

	const milestones = useMemo(() => {
		const rows = projections?.primary || [];
		const fiNumber = (spendNow || 0) * 25; // 4% rule target
		return computeMilestones(rows, { age, retireAge, fiNumber, realRet });
	}, [projections, age, retireAge, realRet, spendNow]);

	return (
		<Card>
			<CardHeader
				icon="🏁"
				title="Milestones"
				subtitle="Where your plan crosses the lines that matter — on a 4% safe-withdrawal target."
			/>
			<div style={{ display: "grid", gap: 4 }}>
				{milestones.map((m) => {
					const isNever = m.age == null;
					const isDepletion = m.key === "depletion";
					const reached = m.reached;
					const color = isDepletion
						? isNever
							? S.accent
							: S.danger
						: isNever
							? S.textDim
							: reached
								? S.accent
								: S.text;
					const yearsAway = m.age != null ? m.age - age : null;
					return (
						<div
							key={m.key}
							style={{
								display: "flex",
								alignItems: "center",
								justifyContent: "space-between",
								gap: 12,
								padding: "11px 0",
								borderBottom: `1px solid ${S.border}`,
							}}
						>
							<div style={{ display: "flex", alignItems: "center", gap: 11 }}>
								<span
									style={{
										width: 9,
										height: 9,
										borderRadius: "50%",
										background: isNever && !isDepletion ? S.border : color,
										boxShadow: !isNever || isDepletion ? `0 0 7px ${color}66` : "none",
										flexShrink: 0,
									}}
								/>
								<span style={{ fontSize: 13.5, fontWeight: 600, color: isNever && !isDepletion ? S.textMuted : S.text }}>
									{m.label}
								</span>
							</div>
							<div style={{ textAlign: "right" }}>
								{isNever ? (
									<span style={{ fontSize: 13, fontWeight: 700, color: isDepletion ? S.accent : S.textDim }}>
										{isDepletion ? "✓ safe" : "—"}
									</span>
								) : (
									<>
										<span style={{ fontSize: 14, fontWeight: 750, color, fontFamily: S.mono }}>
											age {m.age}
										</span>
										<span style={{ fontSize: 11, color: S.textMuted, marginLeft: 7 }}>
											{yearsAway <= 0 ? "now" : `in ${yearsAway}y`}
										</span>
									</>
								)}
							</div>
						</div>
					);
				})}
			</div>
		</Card>
	);
}
